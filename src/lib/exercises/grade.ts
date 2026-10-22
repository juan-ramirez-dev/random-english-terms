import type { Answer, Exercise } from './types'

// Comparison key for typed answers and AI text: case, extra spaces and curly quotes don't matter.
export const normalizeText = (s: string) =>
  s.trim().replace(/\s+/g, ' ').replace(/[’`]/g, "'").toLowerCase()

export function grade(exercise: Exercise, answer: Answer): boolean {
  switch (exercise.kind) {
    case 'multiple-choice':
    case 'context':
    case 'usage':
      return answer === exercise.answer
    case 'fill-gap':
    case 'order':
      return (
        typeof answer === 'string' &&
        normalizeText(answer) === normalizeText(exercise.answer)
      )
    case 'match':
      return (
        typeof answer === 'object' &&
        exercise.pairs.every(pair => answer[pair.phrase] === pair.meaning)
      )
  }
}
