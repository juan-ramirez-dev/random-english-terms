import type { TextRecord, TextSummary } from '@/lib/terms/types'
import { getDb, now } from './db'

interface SummaryRow {
  id: string
  title: string
  word_count: number
  created_at: string
}

interface TextRow {
  id: string
  title: string
  content: string
  word_count: number
  created_at: string
}

export async function insertText(record: {
  id: string
  title: string
  content: string
  wordCount: number
}): Promise<void> {
  const db = await getDb()
  await db.execute(
    `INSERT INTO texts (id, title, content, word_count, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [record.id, record.title, record.content, record.wordCount, now()],
  )
}

export async function listTextSummaries(): Promise<TextSummary[]> {
  const db = await getDb()
  const rows = await db.select<SummaryRow[]>(
    `SELECT id, title, word_count, created_at FROM texts
     ORDER BY created_at DESC`,
  )
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    wordCount: r.word_count,
    createdAt: r.created_at,
  }))
}

export async function getText(id: string): Promise<TextRecord | null> {
  const db = await getDb()
  const [row] = await db.select<TextRow[]>(
    `SELECT id, title, content, word_count, created_at FROM texts WHERE id = ?`,
    [id],
  )
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    wordCount: row.word_count,
    createdAt: row.created_at,
  }
}

export async function deleteText(id: string): Promise<number> {
  const db = await getDb()
  const { rowsAffected } = await db.execute('DELETE FROM texts WHERE id = ?', [
    id,
  ])
  return rowsAffected
}

export async function deleteAllTexts(): Promise<void> {
  const db = await getDb()
  await db.execute('DELETE FROM texts')
}
