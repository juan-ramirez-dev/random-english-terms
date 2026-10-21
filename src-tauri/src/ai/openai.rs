use serde_json::{Value, json};

use super::{Online, check, prompt};
use crate::error::{Code, Result};

const BASE: &str = "https://api.openai.com/v1";

// Listing models validates the key without spending tokens.
pub async fn ping(http: &reqwest::Client, key: &str) -> Result<()> {
    let res = http
        .get(format!("{BASE}/models"))
        .bearer_auth(key)
        .timeout(super::TIMEOUT)
        .send()
        .await;
    check(Online::OpenAi, res).await.map(|_| ())
}

pub async fn generate(
    http: &reqwest::Client,
    key: &str,
    model: &str,
    task: &prompt::Task,
) -> Result<Value> {
    let body = json!({
        "model": model,
        "input": [
            { "role": "system", "content": prompt::system(task) },
            { "role": "user", "content": prompt::user_message(task) },
        ],
        "text": {
            "format": {
                "type": "json_schema",
                "name": task.name(),
                "strict": true,
                "schema": prompt::schema(task),
            }
        },
    });
    let res = http
        .post(format!("{BASE}/responses"))
        .bearer_auth(key)
        .json(&body)
        .timeout(super::GENERATE_TIMEOUT)
        .send()
        .await;
    let data = check(Online::OpenAi, res).await?;
    // output = [{ type: "message", content: [{ type: "output_text", text }] }, ...]
    let text = data["output"]
        .as_array()
        .into_iter()
        .flatten()
        .flat_map(|o| o["content"].as_array().into_iter().flatten())
        .find(|c| c["type"] == "output_text")
        .and_then(|c| c["text"].as_str())
        .ok_or(Online::OpenAi.error(Code::BadResponse))?;
    prompt::parse(text).ok_or(Online::OpenAi.error(Code::BadResponse))
}
