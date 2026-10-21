import type { Expression } from './types'

// Stand-in for the AI output until real inference lands.
export const MOCK_EXPRESSIONS: readonly Expression[] = [
  {
    id: 'x1',
    phrase: 'figure out',
    type: 'phrasal-verb',
    meaning: 'to understand or solve something',
    example: 'We need to figure out why the build keeps failing.',
    mastery: 'new',
  },
  {
    id: 'x2',
    phrase: 'break the ice',
    type: 'idiom',
    meaning: 'to make people feel relaxed at the start of a meeting',
    example: 'She told a joke to break the ice before the demo.',
    mastery: 'new',
  },
  {
    id: 'x3',
    phrase: 'make a decision',
    type: 'collocation',
    meaning: 'to choose after thinking about the options',
    example: 'The team will make a decision by Friday.',
    mastery: 'learning',
  },
  {
    id: 'x4',
    phrase: 'on the same page',
    type: 'idiom',
    meaning: 'sharing the same understanding',
    example: 'Before we start, let us make sure we are on the same page.',
    mastery: 'new',
  },
  {
    id: 'x5',
    phrase: 'follow up',
    type: 'phrasal-verb',
    meaning: 'to do something more about an earlier message or task',
    example: 'I will follow up with the client tomorrow.',
    mastery: 'learning',
  },
  {
    id: 'x6',
    phrase: 'heavy rain',
    type: 'collocation',
    meaning: 'a lot of rain falling hard',
    example: 'Heavy rain delayed the flight by two hours.',
    mastery: 'mastered',
  },
  {
    id: 'x7',
    phrase: 'by the way',
    type: 'expression',
    meaning: 'used to add a side comment',
    example: 'By the way, the meeting moved to three o’clock.',
    mastery: 'new',
  },
  {
    id: 'x8',
    phrase: 'run out of',
    type: 'phrasal-verb',
    meaning: 'to have no more of something',
    example: 'We run out of coffee every Monday.',
    mastery: 'learning',
  },
  {
    id: 'x9',
    phrase: 'a piece of cake',
    type: 'idiom',
    meaning: 'something very easy',
    example: 'The last exercise was a piece of cake.',
    mastery: 'mastered',
  },
  {
    id: 'x10',
    phrase: 'take into account',
    type: 'expression',
    meaning: 'to consider something when deciding',
    example: 'Please take into account the time difference.',
    mastery: 'new',
  },
]

const PER_TEXT = 5

// Each text "contains" a stable slice of the pool, picked from its id.
export function mockExpressionsFor(textId: string): Expression[] {
  let hash = 0
  for (const char of textId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  const start = hash % MOCK_EXPRESSIONS.length
  return Array.from(
    { length: PER_TEXT },
    (_, i) => MOCK_EXPRESSIONS[(start + i) % MOCK_EXPRESSIONS.length],
  )
}
