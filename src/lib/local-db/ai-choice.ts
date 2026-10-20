import type { AiChoice, AiProviderId } from '@/lib/ai/catalog'
import { getDb } from './db'

interface Row {
  provider: AiProviderId
  model: string
}

// The API key doesn't live here: it goes in the OS keychain (Rust).
export async function getAiChoice(): Promise<AiChoice | null> {
  const db = await getDb()
  const [row] = await db.select<Row[]>(
    'SELECT provider, model FROM ai_choice WHERE id = 1',
  )
  return row ?? null
}

export async function saveAiChoice(choice: AiChoice): Promise<void> {
  const db = await getDb()
  await db.execute(
    `INSERT INTO ai_choice (id, provider, model) VALUES (1, ?, ?)
     ON CONFLICT (id) DO UPDATE SET provider = excluded.provider, model = excluded.model`,
    [choice.provider, choice.model],
  )
}

export async function clearAiChoice(): Promise<void> {
  const db = await getDb()
  await db.execute('DELETE FROM ai_choice WHERE id = 1')
}
