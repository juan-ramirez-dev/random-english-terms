import type { Candidate } from '@/lib/terms/extract'
import type { Term, TermStatus, TermWithText } from '@/lib/terms/types'
import { getDb, now } from './db'

interface TermRow {
  id: string
  text_id: string
  word: string
  normalized: string
  status: TermStatus
  decided_at: string | null
}

const toTerm = (r: TermRow): Term => ({
  id: r.id,
  textId: r.text_id,
  word: r.word,
  normalized: r.normalized,
  status: r.status,
  decidedAt: r.decided_at,
})

// No pooled transaction, so insert in chunks. SQLite caps bound variables
// (~999): 5 columns per row → 150 rows stays well under it.
const CHUNK = 150

export async function insertTerms(
  textId: string,
  candidates: Candidate[],
): Promise<void> {
  if (candidates.length === 0) return
  const db = await getDb()
  const created = now()
  for (let start = 0; start < candidates.length; start += CHUNK) {
    const slice = candidates.slice(start, start + CHUNK)
    const values = slice.map(() => '(?, ?, ?, ?, ?)').join(', ')
    const binds = slice.flatMap(c => [
      crypto.randomUUID(),
      textId,
      c.word,
      c.normalized,
      created,
    ])
    await db.execute(
      `INSERT OR IGNORE INTO terms (id, text_id, word, normalized, created_at)
       VALUES ${values}`,
      binds,
    )
  }
}

export async function listTerms(textId: string): Promise<Term[]> {
  const db = await getDb()
  const rows = await db.select<TermRow[]>(
    `SELECT id, text_id, word, normalized, status, decided_at
     FROM terms WHERE text_id = ? ORDER BY rowid`,
    [textId],
  )
  return rows.map(toTerm)
}

export async function listTermsByStatus(
  status: TermStatus,
): Promise<TermWithText[]> {
  const db = await getDb()
  const rows = await db.select<(TermRow & { text_title: string })[]>(
    `SELECT te.id, te.text_id, te.word, te.normalized, te.status, te.decided_at,
            t.title AS text_title
     FROM terms te
     JOIN texts t ON t.id = te.text_id
     WHERE te.status = ?
     ORDER BY te.decided_at DESC, te.rowid DESC`,
    [status],
  )
  return rows.map(r => ({ ...toTerm(r), textTitle: r.text_title }))
}

export async function setTermStatus(
  id: string,
  status: TermStatus,
): Promise<number> {
  const db = await getDb()
  const decidedAt = status === 'new' ? null : now()
  const { rowsAffected } = await db.execute(
    `UPDATE terms SET status = ?, decided_at = ? WHERE id = ?`,
    [status, decidedAt, id],
  )
  return rowsAffected
}
