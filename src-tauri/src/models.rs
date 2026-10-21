use std::path::{Path, PathBuf};

use futures_util::StreamExt;
use serde::Serialize;
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::AsyncWriteExt;

use crate::error::{Code, Result};

pub struct ModelInfo {
    pub id: &'static str,
    pub name: &'static str,
    file: &'static str,
    url: &'static str,
    sha256: &'static str,
    size: u64,
    recommended: bool,
}

// Hash and size taken from Hugging Face. Any other file is rejected.
pub const CATALOG: &[ModelInfo] = &[
    ModelInfo {
        id: "qwen2.5-1.5b",
        name: "Qwen 2.5 1.5B",
        file: "qwen2.5-1.5b-instruct-q4_k_m.gguf",
        url: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
        sha256: "6a1a2eb6d15622bf3c96857206351ba97e1af16c30d7a74ee38970e434e9407e",
        size: 1_117_320_736,
        recommended: false,
    },
    ModelInfo {
        id: "qwen2.5-3b",
        name: "Qwen 2.5 3B",
        file: "qwen2.5-3b-instruct-q4_k_m.gguf",
        url: "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf",
        sha256: "626b4a6678b86442240e33df819e00132d3ba7dddfe1cdc4fbb18e0a9615c62d",
        size: 2_104_932_768,
        recommended: true,
    },
];

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelStatus {
    id: &'static str,
    name: &'static str,
    size: u64,
    recommended: bool,
    installed: bool,
    // The same file is already in another app's folder: reuse it, no download.
    importable: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct Progress {
    id: &'static str,
    downloaded: u64,
    total: u64,
}

fn dir(app: &AppHandle) -> Result<PathBuf> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|_| Code::AppFolderMissing)?;
    Ok(base.join("models"))
}

fn find(id: &str) -> Result<&'static ModelInfo> {
    CATALOG.iter().find(|m| m.id == id).ok_or(Code::UnknownModel.into())
}

// Other apps' model folders next to ours (same Application Support parent).
fn siblings(app: &AppHandle) -> Vec<PathBuf> {
    let Ok(own) = app.path().app_data_dir() else {
        return Vec::new();
    };
    let Some(parent) = own.parent() else {
        return Vec::new();
    };
    let Ok(entries) = std::fs::read_dir(parent) else {
        return Vec::new();
    };
    entries
        .flatten()
        .map(|e| e.path())
        .filter(|p| *p != own)
        .map(|p| p.join("models"))
        .filter(|p| p.is_dir())
        .collect()
}

// Same filename already downloaded by another app.
fn found_in_sibling(app: &AppHandle, file: &str) -> Option<PathBuf> {
    siblings(app)
        .into_iter()
        .map(|d| d.join(file))
        .find(|p| p.exists())
}

#[tauri::command]
pub fn models_status(app: AppHandle) -> Result<Vec<ModelStatus>> {
    let dir = dir(&app)?;
    Ok(CATALOG
        .iter()
        .map(|m| {
            let installed = dir.join(m.file).exists();
            ModelStatus {
                id: m.id,
                name: m.name,
                size: m.size,
                recommended: m.recommended,
                installed,
                importable: !installed && found_in_sibling(&app, m.file).is_some(),
            }
        })
        .collect())
}

#[tauri::command]
pub async fn model_download(
    app: AppHandle,
    http: tauri::State<'_, reqwest::Client>,
    id: String,
) -> Result<()> {
    let model = find(&id)?;
    let dir = dir(&app)?;
    tokio::fs::create_dir_all(&dir)
        .await
        .map_err(|_| Code::ModelSaveFailed)?;

    // Downloads to .part: a cut halfway never leaves a broken model.
    let part = dir.join(format!("{}.part", model.file));
    let result = fetch(&app, &http, model, &part).await;
    if result.is_err() {
        let _ = tokio::fs::remove_file(&part).await;
    }
    result?;

    // Only one model on disk at a time.
    for other in CATALOG.iter().filter(|m| m.id != model.id) {
        let _ = tokio::fs::remove_file(dir.join(other.file)).await;
    }
    Ok(tokio::fs::rename(&part, dir.join(model.file))
        .await
        .map_err(|_| Code::ModelSaveFailed)?)
}

async fn fetch(
    app: &AppHandle,
    http: &reqwest::Client,
    model: &'static ModelInfo,
    part: &Path,
) -> Result<()> {
    let response = http
        .get(model.url)
        .send()
        .await
        .and_then(|r| r.error_for_status())
        .map_err(|_| Code::DownloadFailed)?;

    let mut file = tokio::fs::File::create(part)
        .await
        .map_err(|_| Code::ModelSaveFailed)?;
    let mut hasher = Sha256::new();
    let mut downloaded = 0u64;
    let mut last_emit = 0u64;
    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|_| Code::DownloadFailed)?;
        hasher.update(&chunk);
        file.write_all(&chunk).await.map_err(|_| Code::DiskFull)?;
        downloaded += chunk.len() as u64;
        // One event per ~1%: more floods the IPC.
        if downloaded - last_emit >= model.size / 100 || downloaded == model.size {
            last_emit = downloaded;
            let _ = app.emit(
                "models://progress",
                Progress {
                    id: model.id,
                    downloaded,
                    total: model.size,
                },
            );
        }
    }
    file.flush().await.map_err(|_| Code::ModelSaveFailed)?;

    let hash: String = hasher
        .finalize()
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect();
    if hash != model.sha256 {
        return Err(Code::DownloadCorrupt.into());
    }
    Ok(())
}

// Reads the whole file to confirm it's the model we expect, not something renamed.
fn verify(path: &Path, expected: &str) -> Result<()> {
    use std::io::Read;
    let mut file = std::fs::File::open(path).map_err(|_| Code::ModelSaveFailed)?;
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 1 << 20];
    loop {
        let read = file.read(&mut buf).map_err(|_| Code::ModelSaveFailed)?;
        if read == 0 {
            break;
        }
        hasher.update(&buf[..read]);
    }
    let hash: String = hasher
        .finalize()
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect();
    if hash != expected {
        return Err(Code::DownloadCorrupt.into());
    }
    Ok(())
}

// Reuses a model another app already downloaded, with no network.
#[tauri::command]
pub async fn model_import(app: AppHandle, id: String) -> Result<()> {
    let model = find(&id)?;
    let src = found_in_sibling(&app, model.file).ok_or(Code::ModelSaveFailed)?;

    // Hashing GBs blocks: keep it off the async runtime.
    let check = src.clone();
    let expected = model.sha256;
    tauri::async_runtime::spawn_blocking(move || verify(&check, expected))
        .await
        .map_err(|_| Code::ModelSaveFailed)??;

    let dir = dir(&app)?;
    std::fs::create_dir_all(&dir).map_err(|_| Code::ModelSaveFailed)?;
    let dest = dir.join(model.file);
    let _ = std::fs::remove_file(&dest);

    // Only one model on disk at a time.
    for other in CATALOG.iter().filter(|m| m.id != model.id) {
        let _ = std::fs::remove_file(dir.join(other.file));
    }

    // Hardlink shares the bytes (no extra space); copy when it can't (other disk).
    if std::fs::hard_link(&src, &dest).is_err() {
        std::fs::copy(&src, &dest).map_err(|_| Code::ModelSaveFailed)?;
    }
    Ok(())
}

#[tauri::command]
pub fn model_delete(app: AppHandle, id: String) -> Result<()> {
    let model = find(&id)?;
    let path = dir(&app)?.join(model.file);
    if path.exists() {
        std::fs::remove_file(path).map_err(|_| Code::ModelDeleteFailed)?;
    }
    Ok(())
}
