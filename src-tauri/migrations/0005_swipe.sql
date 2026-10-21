-- v0.9 starts from zero: expressions now come from the built-in list, with saved exercises.
DELETE FROM expressions;

-- Single words from v0.1. Nothing reads them anymore.
DROP TABLE terms;

-- What the user swiped, once per phrase for every text.
CREATE TABLE phrase_decisions (
  normalized TEXT PRIMARY KEY,
  phrase     TEXT NOT NULL,
  type       TEXT NOT NULL
             CHECK (type IN ('phrasal-verb', 'idiom', 'collocation', 'expression')),
  decision   TEXT NOT NULL CHECK (decision IN ('known', 'learn')),
  -- null once the text is deleted: a known phrase stays known.
  text_id    TEXT REFERENCES texts(id) ON DELETE SET NULL,
  sentence   TEXT NOT NULL,
  decided_at TEXT NOT NULL
);

CREATE INDEX idx_phrase_decisions_decision ON phrase_decisions (decision);

-- Written by the AI once, then reused in every session. `data` = { sentence, options, answer }.
CREATE TABLE exercises (
  id            TEXT PRIMARY KEY,
  expression_id TEXT NOT NULL REFERENCES expressions(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL CHECK (kind IN ('multiple-choice', 'fill-gap', 'context')),
  data          TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE INDEX idx_exercises_expression ON exercises (expression_id);
