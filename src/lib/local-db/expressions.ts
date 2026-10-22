import { normalizeText } from '@/lib/exercises/grade'
import { parseLesson } from '@/lib/exercises/parse'
import type { Expression, ExpressionType, Mastery } from '@/lib/exercises/types'
import { getDb, now } from './db'

interface Row {
  id: string
  phrase: string
  type: ExpressionType
  meaning: string
  example: string
  lesson: string
  mastery: Mastery
}

const COLUMNS = 'id, phrase, type, meaning, example, lesson, mastery'

const readLesson = (json: string): unknown => {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

// A broken lesson still leaves the example to show.
const toExpression = ({ lesson, ...r }: Row): Expression => ({
  ...r,
  lesson: parseLesson(readLesson(lesson)) ?? {
    usage: '',
    translation: '',
    examples: [r.example],
    dialog: [],
  },
})

export async function insertExpression(
  textId: string,
  expression: Expression,
): Promise<void> {
  const db = await getDb()
  await db.execute(
    `INSERT INTO expressions
       (id, text_id, phrase, normalized, type, meaning, example, lesson, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      expression.id,
      textId,
      expression.phrase,
      normalizeText(expression.phrase),
      expression.type,
      expression.meaning,
      expression.example,
      JSON.stringify(expression.lesson),
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
