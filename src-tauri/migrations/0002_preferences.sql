-- Single row (id = 1). UI language only; null means "not chosen yet".
CREATE TABLE preferences (
  id       INTEGER PRIMARY KEY CHECK (id = 1),
  language TEXT NOT NULL CHECK (language IN ('en', 'es'))
);
