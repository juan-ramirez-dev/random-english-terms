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

export async function insertExpression(
  textId: string,
  expression: Expression,
): Promise<void> {
  const db = await getDb()
  await db.execute(
    `INSERT INTO expressions
       (id, text_id, phrase, normalized, type, meaning, example, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      expression.id,
      textId,
      expression.phrase,
      normalizeText(expression.phrase),
      expression.type,
      expression.meaning,
      expression.example,
      now(),
    ],
  )
}

// One text, or every text when `textId` is null. Oldest first.
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
