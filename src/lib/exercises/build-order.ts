import { shuffle } from '@/lib/terms/shuffle'
import type { Expression, OrderExercise } from './types'

// Longer sentences turn into a puzzle about grammar, not about the phrase.
const MAX_WORDS = 10
const MIN_WORDS = 3

const split = (sentence: string) => sentence.split(/\s+/).filter(Boolean)

// One of the lesson's examples, with its words shuffled. null = none is short enough.
export function buildOrder(
  expression: Expression,
  seed: number,
): OrderExercise | null {
  const fits = expression.lesson.examples.filter(e => {
    const count = split(e).length
    return count >= MIN_WORDS && count <= MAX_WORDS
  })
  const [example] = shuffle(fits, seed)
  if (!example) return null
  const words = split(example)
  let shuffled = shuffle(words, seed + 1)
  // Already in order would give the answer away.
  if (shuffled.join(' ') === words.join(' ')) {
    shuffled = [...shuffled.slice(1), shuffled[0]]
  }
  return {
    id: `${expression.id}-order`,
    expression,
    kind: 'order',
    words: shuffled,
    answer: words.join(' '),
  }
}
