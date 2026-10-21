use serde_json::{Value, json};

use super::{Online, check, prompt};
use crate::error::{Code, Result};

const BASE: &str = "https://api.anthropic.com/v1";
const VERSION: &str = "2023-06-01";

// Listing models validates the key without spending tokens.
pub async fn ping(http: &reqwest::Client, key: &str) -> Result<()> {
    let res = http
        .get(format!("{BASE}/models"))
        .header("x-api-key", key)
        .header("anthropic-version", VERSION)
        .timeout(super::TIMEOUT)
        .send()
        .await;
    check(Online::Anthropic, res).await.map(|_| ())
}

pub async fn generate(
    http: &reqwest::Client,
    key: &str,
    model: &str,
    task: &prompt::Task,
) -> Result<Value> {
    let body = json!({
        "model": model,
        "max_tokens": 4096,
        "system": prompt::system(task),
        "messages": [{ "role": "user", "content": prompt::user_message(task) }],
        // Short, well-defined jobs: low effort = faster and cheaper.
        "output_config": {
            "effort": "low",
            "format": { "type": "json_schema", "schema": prompt::schema(task) },
        },
    });
    let res = http
        .post(format!("{BASE}/messages"))
        .header("x-api-key", key)
        .header("anthropic-version", VERSION)
        .json(&body)
        .timeout(super::GENERATE_TIMEOUT)
        .send()
        .await;
    let data = check(Online::Anthropic, res).await?;
    if data["stop_reason"] == "refusal" {
        return Err(Code::Refused.into());
    }
    let text = data["content"]
        .as_array()
        .into_iter()
        .flatten()
        .find(|b| b["type"] == "text")
        .and_then(|b| b["text"].as_str())
        .ok_or(Online::Anthropic.error(Code::BadResponse))?;
    prompt::parse(text).ok_or(Online::Anthropic.error(Code::BadResponse))
}
