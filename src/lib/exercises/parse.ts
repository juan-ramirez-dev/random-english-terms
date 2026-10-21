import { shuffle } from '@/lib/terms/shuffle'
import { normalizeText } from './grade'
import type { Exercise, ExpressionType, Expression, MatchPair } from './types'

// The AI's JSON is untrusted: nothing reaches the database or the screen without passing here.

export interface ExpressionDraft {
  phrase: string
  type: ExpressionType
  meaning: string
  example: string
}

const TYPES: readonly ExpressionType[] = [
  'phrasal-verb',
  'idiom',
  'collocation',
  'expression',
]
const MAX_EXPRESSIONS = 30
const GAP = '___'
const MIN_OPTIONS = 2
const MAX_OPTIONS = 6
const MIN_PAIRS = 3
const MAX_PAIRS = 5

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

const texts = (v: unknown): string[] | null =>
  Array.isArray(v) && v.every(item => typeof item === 'string')
    ? v.map(item => item.trim())
    : null

// Expressions the AI listed. Bad entries are dropped, not fixed.
export function parseExpressions(raw: unknown): ExpressionDraft[] {
  if (!isObject(raw) || !Array.isArray(raw.expressions)) return []
  const seen = new Set<string>()
  const drafts: ExpressionDraft[] = []
  for (const item of raw.expressions) {
    if (!isObject(item)) continue
    const phrase = text(item.phrase)
    const meaning = text(item.meaning)
    const example = text(item.example)
    const type = TYPES.find(t => t === item.type)
    if (!phrase || !meaning || !example || !type) continue
    const key = normalizeText(phrase)
    // The example must hold the phrase: fill-gap blanks it out.
    if (!normalizeText(example).includes(key) || seen.has(key)) continue
    seen.add(key)
    drafts.push({ phrase, type, meaning, example })
  }
  return drafts.slice(0, MAX_EXPRESSIONS)
}

// ___ (or longer runs of underscores) once, normalized to exactly ___.
function withGap(sentence: string): string | null {
  const gaps = sentence.match(/_{3,}/g)
  return gaps?.length === 1 ? sentence.replace(/_{3,}/, GAP) : null
}

// Distinct options, as the AI wrote them.
function uniqueOptions(options: string[] | null): string[] | null {
  if (!options) return null
  const unique = new Map(options.map(o => [normalizeText(o), o]))
  const list = [...unique.values()].filter(Boolean)
  const size = list.length
  return size >= MIN_OPTIONS && size <= MAX_OPTIONS ? list : null
}

const sameText = (a: string, b: string) => normalizeText(a) === normalizeText(b)

// One exercise for `expression`. null = the AI's answer is not usable.
// `others` is the pool the AI was given: match pairs may only come from it.
export function parseExercise(
  raw: unknown,
  expression: Expression,
  others: readonly MatchPair[],
  seed: number,
): Exercise | null {
  if (!isObject(raw)) return null
  const base = { id: `${expression.id}-${String(raw.kind)}`, expression }
  const sentence = text(raw.sentence)
  const answer = text(raw.answer)

  switch (raw.kind) {
    case 'multiple-choice': {
      const options = uniqueOptions(texts(raw.options))
      // The answer must be this expression's meaning, or the grade would be about another one.
      const right = options?.find(o => sameText(o, answer))
      if (!options || !right || !sameText(right, expression.meaning)) {
        return null
      }
      return {
        ...base,
        kind: 'multiple-choice',
        answer: right,
        options: shuffle(options, seed),
      }
    }
    case 'fill-gap': {
      const gapped = withGap(sentence)
      if (!gapped || !sameText(answer, expression.phrase)) return null
      return {
        ...base,
        kind: 'fill-gap',
        sentence: gapped,
        answer: expression.phrase,
      }
    }
    case 'context': {
      const gapped = withGap(sentence)
      const options = uniqueOptions(texts(raw.options))
      const right = options?.find(o => sameText(o, expression.phrase))
      if (!gapped || !options || !right || !sameText(answer, right)) return null
      return {
        ...base,
        kind: 'context',
        sentence: gapped,
        answer: right,
        options: shuffle(options, seed),
      }
    }
    case 'match': {
      const pairs = parsePairs(raw.pairs, expression, others)
      if (!pairs) return null
      return {
        ...base,
        kind: 'match',
        pairs,
        meanings: shuffle(
          pairs.map(p => p.meaning),
          seed,
        ),
      }
    }
    default:
      return null
  }
}

function parsePairs(
  raw: unknown,
  expression: Expression,
  others: readonly MatchPair[],
): MatchPair[] | null {
  if (!Array.isArray(raw) || raw.length < MIN_PAIRS || raw.length > MAX_PAIRS)
    return null
  const pool: MatchPair[] = [
    { phrase: expression.phrase, meaning: expression.meaning },
    ...others,
  ]
  const pairs: MatchPair[] = []
  for (const item of raw) {
    if (!isObject(item)) return null
    // Take the pool's own text, so the AI can't slip in a made-up pair.
    const source = pool.find(
      p =>
        sameText(p.phrase, text(item.phrase)) &&
        sameText(p.meaning, text(item.meaning)),
    )
    if (!source || pairs.some(p => p.phrase === source.phrase)) return null
    pairs.push({ phrase: source.phrase, meaning: source.meaning })
  }
  const hasTarget = pairs.some(p => p.phrase === expression.phrase)
  const distinctMeanings = new Set(pairs.map(p => p.meaning)).size
  return hasTarget && distinctMeanings === pairs.length ? pairs : null
}
