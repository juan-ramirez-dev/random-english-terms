import { shuffle } from '@/lib/terms/shuffle'
import { normalizeText } from './grade'
import type { Expression, MatchExercise, MatchPair } from './types'

// The expression plus this many others.
const OTHERS = 3

// Pairs come from saved meanings, so no AI is needed. null = not enough expressions.
export function buildMatch(
  expression: Expression,
  all: readonly Expression[],
  seed: number,
): MatchExercise | null {
  const phrases = new Set([normalizeText(expression.phrase)])
  const meanings = new Set([normalizeText(expression.meaning)])
  const pairs: MatchPair[] = [
    { phrase: expression.phrase, meaning: expression.meaning },
  ]
  for (const other of shuffle(all, seed)) {
    if (pairs.length > OTHERS) break
    const phrase = normalizeText(other.phrase)
    const meaning = normalizeText(other.meaning)
    // Two equal meanings would make the match ambiguous.
    if (phrases.has(phrase) || meanings.has(meaning)) continue
    phrases.add(phrase)
    meanings.add(meaning)
    pairs.push({ phrase: other.phrase, meaning: other.meaning })
  }
  if (pairs.length <= OTHERS) return null
  return {
    id: `${expression.id}-match`,
    expression,
    kind: 'match',
    pairs: shuffle(pairs, seed + 1),
    meanings: shuffle(
      pairs.map(p => p.meaning),
      seed + 2,
    ),
  }
}
