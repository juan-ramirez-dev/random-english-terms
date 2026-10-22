import { buildOrder } from './build-order'
import { grade } from './grade'
import type { Expression } from './types'

const withExamples = (examples: string[]): Expression => ({
  id: 'x1',
  phrase: 'figure out',
  type: 'phrasal-verb',
  meaning: 'to understand',
  example: examples[0],
  lesson: { usage: 'Casual.', translation: '', examples, dialog: [] },
  mastery: 'new',
})

const LONG =
  'In the end we all sat down together and finally figured out the bug.'

describe('buildOrder', () => {
  it('shuffles the words of an example that is short enough', () => {
    const order = buildOrder(withExamples([LONG, 'I figured it out.']), 1)
    expect(order?.answer).toBe('I figured it out.')
    expect(order?.words.toSorted()).toEqual(['I', 'figured', 'it', 'out.'])
  })

  it('is skipped when every example is too long', () => {
    expect(buildOrder(withExamples([LONG, LONG]), 1)).toBeNull()
  })

  it('grades the rebuilt sentence ignoring case', () => {
    const order = buildOrder(withExamples(['I figured it out.']), 1)
    expect(order && grade(order, 'i FIGURED it out.')).toBe(true)
  })
})
