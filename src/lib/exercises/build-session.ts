import { shuffle } from '@/lib/terms/shuffle'
import type {
  Answer,
  Exercise,
  ExerciseKind,
  Expression,
  PracticeSession,
} from './types'

const KINDS: readonly ExerciseKind[] = [
  'multiple-choice',
  'fill-gap',
  'context',
  'match',
]
const GAP = '___'
const OPTIONS = 3
const PAIRS = 4

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function blank(example: string, phrase: string): string {
  return example.replace(new RegExp(escapeRegExp(phrase), 'i'), GAP)
}

const normalize = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()

// The right value plus distractors taken from the other expressions.
function pickOptions(
  correct: string,
  others: readonly string[],
  seed: number,
): string[] {
  const distractors = shuffle(
    others.filter(value => value !== correct),
    seed,
  ).slice(0, OPTIONS - 1)
  return shuffle([correct, ...distractors], seed + 1)
}

function buildExercise(
  expression: Expression,
  kind: ExerciseKind,
  all: readonly Expression[],
  seed: number,
): Exercise {
  const base = { id: `${expression.id}-${kind}`, expression }
  const others = all.filter(e => e.id !== expression.id)

  switch (kind) {
    case 'multiple-choice':
      return {
        ...base,
        kind,
        answer: expression.meaning,
        options: pickOptions(
          expression.meaning,
          others.map(e => e.meaning),
          seed,
        ),
      }
    case 'fill-gap':
      return {
        ...base,
        kind,
        answer: expression.phrase,
        sentence: blank(expression.example, expression.phrase),
      }
    case 'context':
      return {
        ...base,
        kind,
        answer: expression.phrase,
        sentence: blank(expression.example, expression.phrase),
        options: pickOptions(
          expression.phrase,
          others.map(e => e.phrase),
          seed,
        ),
      }
    case 'match': {
      const pairs = [expression, ...shuffle(others, seed).slice(0, PAIRS - 1)]
      return {
        ...base,
        kind,
        pairs: pairs.map(e => ({ phrase: e.phrase, meaning: e.meaning })),
        meanings: shuffle(
          pairs.map(e => e.meaning),
          seed + 1,
        ),
      }
    }
  }
}

// One exercise per expression that is not mastered yet, in a seeded random order.
// `all` also feeds the wrong options, mastered ones included.
export function buildSession(
  all: readonly Expression[],
  seed: number,
): PracticeSession {
  const pending = all.filter(e => e.mastery !== 'mastered')
  const exercises = shuffle(pending, seed).map((expression, i) =>
    buildExercise(expression, KINDS[i % KINDS.length], all, seed + i),
  )
  return { exercises }
}

export function grade(exercise: Exercise, answer: Answer): boolean {
  switch (exercise.kind) {
    case 'multiple-choice':
    case 'context':
      return answer === exercise.answer
    case 'fill-gap':
      return (
        typeof answer === 'string' &&
        normalize(answer) === normalize(exercise.answer)
      )
    case 'match':
      return (
        typeof answer === 'object' &&
        exercise.pairs.every(pair => answer[pair.phrase] === pair.meaning)
      )
  }
}
