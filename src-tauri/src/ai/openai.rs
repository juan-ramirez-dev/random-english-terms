use super::{Online, check};
use crate::error::Result;

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
