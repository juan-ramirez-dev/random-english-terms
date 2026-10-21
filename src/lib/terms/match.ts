import type { ExpressionType } from '@/lib/exercises/types'
import { EVERYDAY } from './dictionary/everyday'
import { PHRASAL_VERBS } from './dictionary/phrasal-verbs'
import { PROFESSIONAL } from './dictionary/professional'
import { TECH } from './dictionary/tech'
import { IRREGULAR_VERBS } from './irregular-verbs'
import { normalize } from './normalize'
import type { DictionaryGroup, FoundPhrase } from './types'

// A run of letters, with inner apostrophes or hyphens: `don't`, `follow-up`.
const TOKEN = /[a-zA-Z]+(?:['’-][a-zA-Z]+)*/g
const SENTENCE = /[^.!?\n]+[.!?]*/g
// "turn the lights off". With more words in between it's rarely the phrasal verb.
const MAX_GAP = 3
const MAX_SENTENCE = 300

interface Entry {
  phrase: string
  type: ExpressionType
  rest: string[]
  separable: boolean
}

const words = (text: string) =>
  Array.from(text.matchAll(TOKEN), m => normalize(m[0]))

// Over-generates on purpose ("setted"): a form nobody writes never matches.
function forms(base: string): string[] {
  const out = [base, `${base}s`, `${base}es`, `${base}d`, `${base}ed`]
  out.push(`${base}ing`, ...(IRREGULAR_VERBS[base] ?? []))
  const last = base.at(-1) ?? ''
  if (last === 'e') out.push(`${base.slice(0, -1)}ing`)
  if (base.endsWith('ie')) out.push(`${base.slice(0, -2)}ying`)
  if (last === 'y')
    out.push(`${base.slice(0, -1)}ies`, `${base.slice(0, -1)}ied`)
  // stop → stopped, stopping.
  if (/[bdglmnprt]/.test(last))
    out.push(`${base}${last}ed`, `${base}${last}ing`)
  return out
}

// First word (any form) → the entries that start with it, longest first.
function buildIndex(groups: readonly DictionaryGroup[]) {
  const seen = new Set<string>()
  const index = new Map<string, Entry[]>()
  for (const group of groups) {
    for (const [type, phrases] of Object.entries(group) as [
      ExpressionType,
      readonly string[],
    ][]) {
      for (const phrase of phrases) {
        const [first, ...rest] = words(phrase)
        if (!first || seen.has(phrase)) continue
        seen.add(phrase)
        const separable = type === 'phrasal-verb' && rest.length === 1
        const entry = { phrase, type, rest, separable }
        for (const form of new Set(forms(first))) {
          index.set(form, [...(index.get(form) ?? []), entry])
        }
      }
    }
  }
  for (const list of index.values()) {
    list.sort((a, b) => b.rest.length - a.rest.length)
  }
  return index
}

const INDEX = buildIndex([PHRASAL_VERBS, TECH, PROFESSIONAL, EVERYDAY])

// Index of the last word, or -1 when the entry isn't here.
function endAt(entry: Entry, tokens: string[], at: number): number {
  if (entry.rest.every((word, k) => tokens[at + 1 + k] === word)) {
    return at + entry.rest.length
  }
  if (!entry.separable) return -1
  const gap = tokens.slice(at + 2, at + 2 + MAX_GAP).indexOf(entry.rest[0])
  return gap === -1 ? -1 : at + 2 + gap
}

// The longest phrase that starts here. Written together beats split.
function longestAt(tokens: string[], at: number) {
  let best: { entry: Entry; end: number } | null = null
  for (const entry of INDEX.get(tokens[at]) ?? []) {
    const end = endAt(entry, tokens, at)
    const split = end > at + entry.rest.length
    if (end !== -1 && !split) return { entry, end }
    if (end !== -1 && !best) best = { entry, end }
  }
  return best
}

// Built-in phrases in a text, once each, in reading order.
// A phrase can't start inside another one: "by end of day" hides "end of day".
export function findPhrases(text: string): FoundPhrase[] {
  const found = new Map<string, FoundPhrase>()
  for (const match of text.matchAll(SENTENCE)) {
    const tokens = words(match[0])
    const sentence = match[0].trim().slice(0, MAX_SENTENCE)
    let covered = -1
    for (let at = 0; at < tokens.length; at++) {
      if (at <= covered) continue
      const hit = longestAt(tokens, at)
      if (!hit) continue
      covered = hit.end
      const { phrase, type } = hit.entry
      if (!found.has(phrase)) found.set(phrase, { phrase, type, sentence })
    }
  }
  return [...found.values()]
}

// Total words in the text (for display).
export const countWords = (text: string): number =>
  (text.match(TOKEN) ?? []).length
