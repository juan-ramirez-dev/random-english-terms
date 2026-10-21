-- Expressions the AI found in a text. Saved once: opening the text again reads from here.
CREATE TABLE expressions (
  id         TEXT PRIMARY KEY,
  text_id    TEXT NOT NULL REFERENCES texts(id) ON DELETE CASCADE,
  phrase     TEXT NOT NULL,
  normalized TEXT NOT NULL,
  type       TEXT NOT NULL
             CHECK (type IN ('phrasal-verb', 'idiom', 'collocation', 'expression')),
  meaning    TEXT NOT NULL,
  example    TEXT NOT NULL,
  mastery    TEXT NOT NULL DEFAULT 'new'
             CHECK (mastery IN ('new', 'learning', 'mastered')),
  created_at TEXT NOT NULL,
  UNIQUE (text_id, normalized)
);

CREATE INDEX idx_expressions_text ON expressions (text_id);
CREATE INDEX idx_expressions_mastery ON expressions (mastery);

-- null = the AI hasn't read this text yet.
ALTER TABLE texts ADD COLUMN analyzed_at TEXT;

-- Days with a finished practice session (local date, YYYY-MM-DD). The streak is computed from these.
CREATE TABLE practice_days (
  day TEXT PRIMARY KEY
);
