import { getDb } from './db'

export async function addPracticeDay(day: string): Promise<void> {
  const db = await getDb()
  await db.execute('INSERT OR IGNORE INTO practice_days (day) VALUES (?)', [
    day,
  ])
}

export async function listPracticeDays(): Promise<string[]> {
  const db = await getDb()
  const rows = await db.select<{ day: string }[]>(
    'SELECT day FROM practice_days',
  )
  return rows.map(r => r.day)
}
