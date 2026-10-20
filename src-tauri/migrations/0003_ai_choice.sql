-- The AI that generates exercises. One row (id = 1); no row means "not chosen".
-- The API key never lives here: it goes in the OS keychain (Rust).
CREATE TABLE ai_choice (
  id       INTEGER PRIMARY KEY CHECK (id = 1),
  provider TEXT NOT NULL CHECK (provider IN ('local', 'openai', 'anthropic', 'gemini')),
  -- Local: id of the downloaded model. Online: the provider's model id.
  model    TEXT NOT NULL
);
