import type { ExpressionDraft } from '@/lib/exercises/parse'
import { normalizeText } from '@/lib/exercises/grade'
import type { Expression, ExpressionType, Mastery } from '@/lib/exercises/types'
import { getDb, now } from './db'

interface Row {
  id: string
  phrase: string
  type: ExpressionType
  meaning: string
  example: string
  mastery: Mastery
}

const COLUMNS = 'id, phrase, type, meaning, example, mastery'

const toExpression = (r: Row): Expression => ({ ...r })

export async function getAnalyzedAt(textId: string): Promise<string | null> {
  const db = await getDb()
  const [row] = await db.select<{ analyzed_at: string | null }[]>(
    'SELECT analyzed_at FROM texts WHERE id = ?',
    [textId],
  )
  return row?.analyzed_at ?? null
}

export async function markAnalyzed(textId: string): Promise<void> {
  const db = await getDb()
  await db.execute('UPDATE texts SET analyzed_at = ? WHERE id = ?', [
    now(),
    textId,
  ])
}

// The AI returns at most 30, so one statement stays under SQLite's bound-variable cap.
export async function insertExpressions(
  textId: string,
  drafts: ExpressionDraft[],
): Promise<void> {
  if (drafts.length === 0) return
  const db = await getDb()
  const created = now()
  const values = drafts.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ')
  const binds = drafts.flatMap(d => [
    crypto.randomUUID(),
    textId,
    d.phrase,
    normalizeText(d.phrase),
    d.type,
    d.meaning,
    d.example,
    created,
  ])
  await db.execute(
    `INSERT OR IGNORE INTO expressions
       (id, text_id, phrase, normalized, type, meaning, example, created_at)
     VALUES ${values}`,
    binds,
  )
}

// One text, or every text when `textId` is null. Insert order = the order the AI gave.
export async function listExpressions(
  textId: string | null,
): Promise<Expression[]> {
  const db = await getDb()
  const rows = textId
    ? await db.select<Row[]>(
        `SELECT ${COLUMNS} FROM expressions WHERE text_id = ? ORDER BY rowid`,
        [textId],
      )
    : await db.select<Row[]>(
        `SELECT ${COLUMNS} FROM expressions ORDER BY rowid`,
      )
  return rows.map(toExpression)
}

export async function getMastery(id: string): Promise<Mastery | null> {
  const db = await getDb()
  const [row] = await db.select<{ mastery: Mastery }[]>(
    'SELECT mastery FROM expressions WHERE id = ?',
    [id],
  )
  return row?.mastery ?? null
}

export async function setMastery(id: string, mastery: Mastery): Promise<void> {
  const db = await getDb()
  await db.execute('UPDATE expressions SET mastery = ? WHERE id = ?', [
    mastery,
    id,
  ])
}
