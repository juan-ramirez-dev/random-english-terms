export type TermStatus = 'new' | 'known' | 'learning'

export interface Term {
  id: string
  textId: string
  word: string
  normalized: string
  status: TermStatus
  decidedAt: string | null
}

// A term plus the title of the text it came from (for the Words lists).
export interface TermWithText extends Term {
  textTitle: string
}

export interface TextRecord {
  id: string
  title: string
  content: string
  wordCount: number
  createdAt: string
}

// A library row: the text plus how many terms it has and how many are still new.
export interface TextSummary {
  id: string
  title: string
  wordCount: number
  createdAt: string
  termCount: number
  newCount: number
}
