import type { Preferences } from '@/lib/i18n/locale'
import { getDb } from './db'

// null = not chosen yet: the app uses the system language.
export async function getPreferences(): Promise<Preferences | null> {
  const db = await getDb()
  const [row] = await db.select<Preferences[]>(
    'SELECT language FROM preferences WHERE id = 1',
  )
  return row ?? null
}

export async function savePreferences(next: Preferences): Promise<void> {
  const db = await getDb()
  await db.execute(
    `INSERT INTO preferences (id, language) VALUES (1, ?)
     ON CONFLICT (id) DO UPDATE SET language = excluded.language`,
    [next.language],
  )
}
