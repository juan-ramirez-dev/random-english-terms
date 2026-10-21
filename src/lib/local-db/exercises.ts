import type { StoredExercise, StoredKind } from '@/lib/exercises/types'
import { getDb, now } from './db'

interface Row {
  expression_id: string
  kind: StoredKind
  data: string
}

export interface ExerciseRow {
  expressionId: string
  kind: StoredKind
  // JSON of { sentence, options, answer }. Parsed and validated by the caller.
  data: string
}

// Three per expression at most, so one statement stays under SQLite's bound-variable cap.
export async function insertExercises(
  expressionId: string,
  exercises: StoredExercise[],
): Promise<void> {
  if (exercises.length === 0) return
  const db = await getDb()
  const created = now()
  const values = exercises.map(() => '(?, ?, ?, ?, ?)').join(', ')
  const binds = exercises.flatMap(({ kind, sentence, options, answer }) => [
    crypto.randomUUID(),
    expressionId,
    kind,
    JSON.stringify({ sentence, options, answer }),
    created,
  ])
  await db.execute(
    `INSERT INTO exercises (id, expression_id, kind, data, created_at)
     VALUES ${values}`,
    binds,
  )
}

export async function listExercises(
  expressionIds: string[],
): Promise<ExerciseRow[]> {
  if (expressionIds.length === 0) return []
  const db = await getDb()
  const marks = expressionIds.map(() => '?').join(', ')
  const rows = await db.select<Row[]>(
    `SELECT expression_id, kind, data FROM exercises
     WHERE expression_id IN (${marks})`,
    expressionIds,
  )
  return rows.map(r => ({
    expressionId: r.expression_id,
    kind: r.kind,
    data: r.data,
  }))
}
