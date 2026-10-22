import { parseExercise, parseLearned, parseLesson, readJson } from './parse'
import type { Expression, PendingPhrase } from './types'

const expression: Expression = {
  id: 'x1',
  phrase: 'figure out',
  type: 'phrasal-verb',
  meaning: 'to understand',
  example: 'We need to figure out why it fails.',
  lesson: {
    usage: 'Casual, when you find the answer.',
    translation: 'descifrar',
    examples: ['We need to figure out why it fails.', 'I figured it out.'],
    dialog: [],
  },
  mastery: 'new',
}

const exercise = (raw: Record<string, unknown>) =>
  parseExercise(
    {
      kind: 'multiple-choice',
      sentence: '',
      options: [],
      answer: '',
      ...raw,
    },
    expression,
    1,
  )

describe('parseExercise', () => {
  it('rejects an answer that is not in the options', () => {
    expect(
      exercise({
        kind: 'multiple-choice',
        options: ['to stop', 'to leave'],
        answer: 'to understand',
      }),
    ).toBeNull()
  })

  it("rejects a multiple-choice whose answer is another expression's meaning", () => {
    expect(
      exercise({
        kind: 'multiple-choice',
        options: ['to stop trying', 'to understand', 'to leave'],
        answer: 'to stop trying',
      }),
    ).toBeNull()
  })

  it('accepts a multiple-choice whose answer is the expression meaning', () => {
    const result = exercise({
      kind: 'multiple-choice',
      options: ['to stop', 'to understand', 'to leave'],
      answer: 'to understand',
    })
    expect(result?.kind === 'multiple-choice' && result.answer).toBe(
      'to understand',
    )
  })

  it('rejects a fill-gap sentence without ___', () => {
    expect(
      exercise({
        kind: 'fill-gap',
        sentence: 'We need to figure out why.',
        answer: 'figure out',
      }),
    ).toBeNull()
  })

  it('rejects a usage exercise whose answer is not one of the options', () => {
    expect(
      exercise({
        kind: 'usage',
        options: ['I figured out the bug.', 'I figured out the floor.'],
        answer: 'She figured out the answer.',
      }),
    ).toBeNull()
  })

  it('rejects a fill-gap whose answer is not the expression', () => {
    expect(
      exercise({
        kind: 'fill-gap',
        sentence: 'We need to ___ why.',
        answer: 'give up',
      }),
    ).toBeNull()
  })
})

const pending: PendingPhrase[] = [
  {
    phrase: 'figure out',
    type: 'phrasal-verb',
    sentence: 'We need to figure out why it fails.',
    textId: 't1',
  },
]

const fillGap = {
  kind: 'fill-gap',
  sentence: "I can't ___ this bug.",
  options: [],
  answer: 'figure out',
}

const lesson = {
  usage: 'Casual, when you find the answer.',
  translation: 'descifrar',
  examples: ['She figured out the answer.', 'I figured it out.'],
  dialog: ['A: Did it work?', 'B: Yes, I figured it out.'],
}

const learned = (overrides: Record<string, unknown> = {}) => ({
  phrase: 'figure out',
  meaning: 'to understand',
  ...lesson,
  exercises: [fillGap],
  ...overrides,
})

describe('parseLesson', () => {
  it('rejects a lesson without usage', () => {
    expect(parseLesson({ ...lesson, usage: ' ' })).toBeNull()
  })

  it('rejects a lesson with fewer than two examples', () => {
    expect(
      parseLesson({ ...lesson, examples: ['I figured it out.'] }),
    ).toBeNull()
  })

  it('accepts a lesson with an empty dialog', () => {
    expect(parseLesson({ ...lesson, dialog: [] })?.dialog).toEqual([])
  })
})

const FENCE = '```'

describe('parseLearned', () => {
  it('accepts JSON inside a ```json block', () => {
    const json = JSON.stringify({ expressions: [learned()] })
    const pasted = `Here you go:\n${FENCE}json\n${json}\n${FENCE}`
    const result = parseLearned(readJson(pasted), pending)
    expect(result.map(l => l.expression.phrase)).toEqual(['figure out'])
  })

  it('reads an answer whose quotes were turned into curly quotes', () => {
    const json = JSON.stringify({ expressions: [learned()] })
    const pasted = json.replace(/"/g, '”')
    const result = parseLearned(readJson(pasted), pending)
    expect(result.map(l => l.expression.phrase)).toEqual(['figure out'])
  })

  it('ignores phrases that were not requested', () => {
    const extra = learned({ phrase: 'give up', exercises: [] })
    const result = parseLearned({ expressions: [extra, learned()] }, pending)
    expect(result.map(l => l.expression.phrase)).toEqual(['figure out'])
  })

  it('drops invalid exercises', () => {
    const broken = { ...fillGap, sentence: 'No gap here.' }
    const result = parseLearned(
      { expressions: [learned({ exercises: [broken, fillGap] })] },
      pending,
    )
    expect(result[0].exercises).toEqual([fillGap])
  })
})
