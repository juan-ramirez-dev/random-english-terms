import Database from '@tauri-apps/plugin-sql'

// Same name as src-tauri/src/lib.rs. The file lives in appConfigDir.
export const DB_FILE = 'lexio.db'

// What the resources use. Allows tests without Tauri.
export interface Db {
  execute(sql: string, binds?: unknown[]): Promise<{ rowsAffected: number }>
  select<T>(sql: string, binds?: unknown[]): Promise<T>
}

// The plugin uses a pool, so there are no multi-statement transactions
// (accepted risk: local app, single user). sqlx opens with foreign_keys = ON.
let connection: Promise<Db> | null = null

export function getDb(): Promise<Db> {
  connection ??= Database.load(`sqlite:${DB_FILE}`)
  return connection
}

export const now = () => new Date().toISOString()
