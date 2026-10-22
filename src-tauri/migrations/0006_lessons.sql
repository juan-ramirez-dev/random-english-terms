-- v0.10 starts from zero again (still in testing): every expression needs a lesson.
DELETE FROM phrase_decisions;
DELETE FROM expressions;

-- JSON of { usage, translation, examples, dialog }, written by the AI. Validated on read.
ALTER TABLE expressions ADD COLUMN lesson TEXT NOT NULL DEFAULT '{}';

-- Rebuilt so the CHECK allows `usage`. It's empty after the delete above.
DROP TABLE exercises;

CREATE TABLE exercises (
  id            TEXT PRIMARY KEY,
  expression_id TEXT NOT NULL REFERENCES expressions(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL
                CHECK (kind IN ('multiple-choice', 'fill-gap', 'context', 'usage')),
  data          TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE INDEX idx_exercises_expression ON exercises (expression_id);
