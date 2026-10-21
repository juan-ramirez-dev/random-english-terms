import type { ExpressionType } from '@/lib/exercises/types'

// A built-in list: lowercase phrases, base form, grouped by type.
export type DictionaryGroup = Partial<Record<ExpressionType, readonly string[]>>

// A built-in phrase found in a text, with the sentence it showed up in.
export interface FoundPhrase {
  phrase: string
  type: ExpressionType
  sentence: string
}

export interface TextRecord {
  id: string
  title: string
  content: string
  wordCount: number
  createdAt: string
}

export interface TextSummary {
  id: string
  title: string
  wordCount: number
  createdAt: string
}
