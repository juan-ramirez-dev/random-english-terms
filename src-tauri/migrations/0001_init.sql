-- A reading or transcript the user pasted. Its words become review terms.
CREATE TABLE texts (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

-- One candidate word per text. `normalized` is the dedup key within a text.
CREATE TABLE terms (
  id         TEXT PRIMARY KEY,
  text_id    TEXT NOT NULL REFERENCES texts(id) ON DELETE CASCADE,
  word       TEXT NOT NULL,
  normalized TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'new'
             CHECK (status IN ('new', 'known', 'learning')),
  decided_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (text_id, normalized)
);

CREATE INDEX idx_terms_text ON terms (text_id);
CREATE INDEX idx_terms_status ON terms (status);
