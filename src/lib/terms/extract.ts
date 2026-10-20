import { normalize } from './normalize'
import { STOPWORDS } from './stopwords'

const MIN_LENGTH = 3

// A run of letters, with inner apostrophes or hyphens: `don't`, `well-known`.
const TOKEN = /[a-zA-Z]+(?:['’-][a-zA-Z]+)*/g

export interface Candidate {
  word: string
  normalized: string
}

// Unique review candidates, in first-seen order. v1: single words, no AI.
export function extractTerms(text: string): Candidate[] {
  const seen = new Set<string>()
  const out: Candidate[] = []
  for (const match of text.matchAll(TOKEN)) {
    const word = match[0]
    const key = normalize(word)
    if (key.length < MIN_LENGTH) continue
    if (STOPWORDS.has(key)) continue
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ word, normalized: key })
  }
  return out
}

// Total words in the text (for display), before filtering.
export function countWords(text: string): number {
  return (text.match(TOKEN) ?? []).length
}
