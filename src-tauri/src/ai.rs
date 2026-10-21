mod anthropic;
mod gemini;
mod keys;
pub mod local;
mod openai;
mod prompt;

use std::time::Duration;

use serde_json::Value;
use tauri::{AppHandle, Manager};

use crate::error::{AppError, Code, Result};
use crate::models;

// Listing models shouldn't take longer. Keeps the button from hanging.
const TIMEOUT: Duration = Duration::from_secs(60);
// Writing a batch of expressions with their exercises takes longer.
const GENERATE_TIMEOUT: Duration = Duration::from_secs(120);

#[derive(Clone, Copy)]
pub enum Online {
    OpenAi,
    Anthropic,
    Gemini,
}

impl Online {
    fn parse(id: &str) -> Result<Self> {
        match id {
            "openai" => Ok(Self::OpenAi),
            "anthropic" => Ok(Self::Anthropic),
            "gemini" => Ok(Self::Gemini),
            _ => Err(Code::UnknownProvider.into()),
        }
    }

    fn id(self) -> &'static str {
        match self {
            Self::OpenAi => "openai",
            Self::Anthropic => "anthropic",
            Self::Gemini => "gemini",
        }
    }

    fn name(self) -> &'static str {
        match self {
            Self::OpenAi => "OpenAI",
            Self::Anthropic => "Anthropic",
            Self::Gemini => "Gemini",
        }
    }

    fn error(self, code: Code) -> AppError {
        AppError::provider(code, self.name())
    }
}

// Turns the HTTP response into JSON or an error the user understands.
async fn check(provider: Online, res: reqwest::Result<reqwest::Response>) -> Result<Value> {
    let res = res.map_err(|_| provider.error(Code::Offline))?;
    match res.status().as_u16() {
        200..=299 => res
            .json()
            .await
            .map_err(|_| provider.error(Code::BadResponse)),
        401 | 403 => Err(provider.error(Code::KeyRejected)),
        404 => Err(provider.error(Code::ModelNotFound)),
        429 => Err(provider.error(Code::RateLimited)),
        status => Err(provider.error(Code::ProviderFailed).with_status(status)),
    }
}

// Tested before saving: a bad key never reaches the keychain.
#[tauri::command]
pub async fn ai_save_key(
    http: tauri::State<'_, reqwest::Client>,
    provider: String,
    key: String,
) -> Result<()> {
    let provider = Online::parse(&provider)?;
    let key = key.trim();
    if key.is_empty() {
        return Err(Code::EmptyKey.into());
    }
    match provider {
        Online::OpenAi => openai::ping(&http, key).await?,
        Online::Anthropic => anthropic::ping(&http, key).await?,
        Online::Gemini => gemini::ping(&http, key).await?,
    }
    keys::save(provider, key)
}

#[tauri::command]
pub fn ai_delete_key(provider: String) -> Result<()> {
    keys::delete(Online::parse(&provider)?)
}

// One call per task. Returns the AI's raw JSON: the front validates it.
#[tauri::command]
pub async fn ai_generate(
    app: AppHandle,
    http: tauri::State<'_, reqwest::Client>,
    provider: String,
    model: String,
    task: prompt::Task,
) -> Result<Value> {
    if provider == "local" {
        let path = models::installed_path(&app, &model)?;
        // The model runs for seconds: keep it off the async runtime.
        return tauri::async_runtime::spawn_blocking(move || {
            local::generate(&app.state::<local::Engine>(), path, &task)
        })
        .await
        .map_err(|_| Code::LocalModelFailed)?;
    }

    let provider = Online::parse(&provider)?;
    let key = keys::read(provider)?;
    match provider {
        Online::OpenAi => openai::generate(&http, &key, &model, &task).await,
        Online::Anthropic => anthropic::generate(&http, &key, &model, &task).await,
        Online::Gemini => gemini::generate(&http, &key, &model, &task).await,
    }
}

// The same prompt as `ai_generate`, as text the user pastes into Claude or another chat.
#[tauri::command]
pub fn ai_prompt(task: prompt::Task) -> String {
    prompt::for_chat(&task)
}
