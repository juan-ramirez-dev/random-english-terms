import { normalizeText } from '@/lib/exercises/grade'
import type {
  Decision,
  ExpressionType,
  PendingPhrase,
} from '@/lib/exercises/types'
import { getDb, now } from './db'

interface PendingRow {
  phrase: string
  type: ExpressionType
  sentence: string
  text_id: string
}

export async function listDecided(): Promise<string[]> {
  const db = await getDb()
  const rows = await db.select<{ normalized: string }[]>(
    'SELECT normalized FROM phrase_decisions',
  )
  return rows.map(r => r.normalized)
}

// A phrase is decided once for every text. Deciding again overwrites it.
export async function saveDecision(input: {
  phrase: string
  type: ExpressionType
  sentence: string
  textId: string
  decision: Decision
}): Promise<void> {
  const db = await getDb()
  await db.execute(
    `INSERT INTO phrase_decisions
       (normalized, phrase, type, decision, text_id, sentence, decided_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (normalized) DO UPDATE SET
       decision = excluded.decision,
       text_id = excluded.text_id,
       sentence = excluded.sentence,
       decided_at = excluded.decided_at`,
    [
      normalizeText(input.phrase),
      input.phrase,
      input.type,
      input.decision,
      input.textId,
      input.sentence,
      now(),
    ],
  )
}

// Swiped right, still without meaning or exercises. Oldest first.
// A phrase whose text was deleted has nowhere to be saved, so it's left out.
export async function listPending(): Promise<PendingPhrase[]> {
  const db = await getDb()
  const rows = await db.select<PendingRow[]>(
    `SELECT d.phrase, d.type, d.sentence, d.text_id
     FROM phrase_decisions d
     WHERE d.decision = 'learn'
       AND d.text_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM expressions e WHERE e.normalized = d.normalized)
     ORDER BY d.decided_at`,
  )
  return rows.map(r => ({
    phrase: r.phrase,
    type: r.type,
    sentence: r.sentence,
    textId: r.text_id,
  }))
}
