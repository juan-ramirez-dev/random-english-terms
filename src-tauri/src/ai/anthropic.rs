use super::{Online, check};
use crate::error::Result;

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
