use super::{Online, check};
use crate::error::Result;

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
