import { grade } from './grade'
import type {
  ContextExercise,
  Expression,
  FillGapExercise,
  MatchExercise,
  MultipleChoiceExercise,
} from './types'

const expression: Expression = {
  id: 'a',
  phrase: 'figure out',
  type: 'phrasal-verb',
  meaning: 'to understand or solve something',
  example: 'We need to figure out why it fails.',
  lesson: {
    usage: '',
    translation: '',
    examples: ['We need to figure out why it fails.'],
    dialog: [],
  },
  mastery: 'new',
}

const multipleChoice: MultipleChoiceExercise = {
  id: 'a-multiple-choice',
  expression,
  kind: 'multiple-choice',
  options: ['to understand or solve something', 'to stop', 'to leave'],
  answer: 'to understand or solve something',
}

const context: ContextExercise = {
  id: 'a-context',
  expression,
  kind: 'context',
  sentence: 'We need to ___ why it fails.',
  options: ['figure out', 'give up', 'run out of'],
  answer: 'figure out',
}

const fillGap: FillGapExercise = {
  id: 'a-fill-gap',
  expression,
  kind: 'fill-gap',
  sentence: 'We need to ___ why it fails.',
  answer: 'figure out',
}

const match: MatchExercise = {
  id: 'a-match',
  expression,
  kind: 'match',
  pairs: [
    { phrase: 'figure out', meaning: 'to understand' },
    { phrase: 'give up', meaning: 'to stop trying' },
  ],
  meanings: ['to stop trying', 'to understand'],
}

describe('grade', () => {
  it('accepts a multiple-choice or context answer only when it equals the answer', () => {
    expect(grade(multipleChoice, multipleChoice.answer)).toBe(true)
    expect(grade(multipleChoice, 'to leave')).toBe(false)
    expect(grade(context, context.answer)).toBe(true)
    expect(grade(context, 'give up')).toBe(false)
  })

  it('accepts a fill-gap answer ignoring case and extra spaces', () => {
    expect(grade(fillGap, '  FIGURE   out ')).toBe(true)
    expect(grade(fillGap, 'nope')).toBe(false)
  })

  it('accepts a match only when every pair is right', () => {
    const right = {
      'figure out': 'to understand',
      'give up': 'to stop trying',
    }
    const wrong = { 'figure out': 'to stop trying', 'give up': 'to understand' }
    expect(grade(match, right)).toBe(true)
    expect(grade(match, wrong)).toBe(false)
  })
})
