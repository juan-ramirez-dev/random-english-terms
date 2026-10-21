use serde_json::{Value, json};

use super::{Online, check, prompt};
use crate::error::{Code, Result};

const BASE: &str = "https://generativelanguage.googleapis.com/v1beta";

// Listing models validates the key without spending tokens.
pub async fn ping(http: &reqwest::Client, key: &str) -> Result<()> {
    let res = http
        .get(format!("{BASE}/models"))
        .header("x-goog-api-key", key)
        .timeout(super::TIMEOUT)
        .send()
        .await;
    check(Online::Gemini, res).await.map(|_| ())
}

pub async fn generate(
    http: &reqwest::Client,
    key: &str,
    model: &str,
    task: &prompt::Task,
) -> Result<Value> {
    let body = json!({
        "systemInstruction": { "parts": [{ "text": prompt::system(task) }] },
        "contents": [{ "role": "user", "parts": [{ "text": prompt::user_message(task) }] }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseJsonSchema": prompt::schema(task),
        },
    });
    let res = http
        .post(format!("{BASE}/models/{model}:generateContent"))
        .header("x-goog-api-key", key)
        .json(&body)
        .timeout(super::GENERATE_TIMEOUT)
        .send()
        .await;
    let data = check(Online::Gemini, res).await?;
    let text = data["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .ok_or(Online::Gemini.error(Code::BadResponse))?;
    prompt::parse(text).ok_or(Online::Gemini.error(Code::BadResponse))
}
