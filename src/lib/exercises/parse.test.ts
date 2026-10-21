import { parseExercise, parseExpressions } from './parse'
import type { Expression, MatchPair } from './types'

const entry = (overrides: Record<string, unknown> = {}) => ({
  phrase: 'figure out',
  type: 'phrasal-verb',
  meaning: 'to understand or solve something',
  example: 'We need to figure out why it fails.',
  ...overrides,
})

describe('parseExpressions', () => {
  it('keeps a valid expression', () => {
    expect(parseExpressions({ expressions: [entry()] })).toEqual([entry()])
  })

  it('drops expressions whose example lacks the phrase', () => {
    const bad = entry({ example: 'We need to work out why it fails.' })
    expect(parseExpressions({ expressions: [bad] })).toEqual([])
  })

  it('drops unknown types', () => {
    const bad = entry({ type: 'slang' })
    expect(parseExpressions({ expressions: [bad] })).toEqual([])
  })

  it('drops duplicates ignoring case and spacing', () => {
    const copy = entry({
      phrase: 'Figure  Out',
      example: 'Figure  Out the cause.',
    })
    expect(parseExpressions({ expressions: [entry(), copy] })).toEqual([
      entry(),
    ])
  })

  it('returns nothing when the shape is wrong', () => {
    expect(parseExpressions({ items: [] })).toEqual([])
    expect(parseExpressions('text')).toEqual([])
  })
})

const expression: Expression = {
  id: 'x1',
  phrase: 'figure out',
  type: 'phrasal-verb',
  meaning: 'to understand',
  example: 'We need to figure out why it fails.',
  mastery: 'new',
}

const others: MatchPair[] = [
  { phrase: 'give up', meaning: 'to stop trying' },
  { phrase: 'run out of', meaning: 'to have no more' },
  { phrase: 'break the ice', meaning: 'to start a conversation' },
]

const exercise = (raw: Record<string, unknown>) =>
  parseExercise(
    {
      kind: 'multiple-choice',
      sentence: '',
      options: [],
      answer: '',
      pairs: [],
      ...raw,
    },
    expression,
    others,
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

  it('rejects a fill-gap whose answer is not the expression', () => {
    expect(
      exercise({
        kind: 'fill-gap',
        sentence: 'We need to ___ why.',
        answer: 'give up',
      }),
    ).toBeNull()
  })

  it('rejects match pairs that are not from the pool', () => {
    expect(
      exercise({
        kind: 'match',
        pairs: [
          { phrase: 'figure out', meaning: 'to understand' },
          { phrase: 'give up', meaning: 'to stop trying' },
          { phrase: 'hit the road', meaning: 'to leave' },
        ],
      }),
    ).toBeNull()
  })

  it('rejects a match that leaves out the expression', () => {
    expect(
      exercise({
        kind: 'match',
        pairs: others,
      }),
    ).toBeNull()
  })

  it('accepts a match built from the pool', () => {
    const result = exercise({
      kind: 'match',
      pairs: [
        { phrase: 'figure out', meaning: 'to understand' },
        ...others.slice(0, 2),
      ],
    })
    expect(result?.kind === 'match' && result.pairs).toHaveLength(3)
  })
})
