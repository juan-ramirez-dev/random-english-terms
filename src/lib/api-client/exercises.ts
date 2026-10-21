import { buildSession } from '@/lib/exercises/build-session'
import { MOCK_EXPRESSIONS, mockExpressionsFor } from '@/lib/exercises/mock-data'
import type {
  Expression,
  Mastery,
  PracticeSession,
} from '@/lib/exercises/types'
import { loadChoice } from './ai'
import { ApiClientError } from './http'

// Mock "AI" until real inference lands. State lives in memory only.
export type Scenario = 'ok' | 'analyzing' | 'error' | 'empty'

const DELAY = 900
const SLOW_DELAY = 8000

let scenario: Scenario = 'ok'
let streak = 3
let practicedToday = false
const mastery = new Map<string, Mastery>(
  MOCK_EXPRESSIONS.map(e => [e.id, e.mastery]),
)

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const withMastery = (e: Expression): Expression => ({
  ...e,
  mastery: mastery.get(e.id) ?? e.mastery,
})

export const getScenario = () => scenario
export const setScenario = (next: Scenario) => {
  scenario = next
}

async function failIfScenario(): Promise<void> {
  if (scenario === 'error') {
    const choice = await loadChoice()
    throw new ApiClientError(502, 'badResponse', {
      provider: choice?.provider ?? 'AI',
    })
  }
  if (scenario === 'empty') throw new ApiClientError(422, 'noExpressions')
}

export async function analyzeText(textId: string): Promise<Expression[]> {
  await wait(scenario === 'analyzing' ? SLOW_DELAY : DELAY)
  await failIfScenario()
  return mockExpressionsFor(textId).map(withMastery)
}

// A session over one text, or over everything when no text is given.
export async function generateSession(
  textId: string | null,
): Promise<PracticeSession> {
  await wait(scenario === 'analyzing' ? SLOW_DELAY : DELAY / 2)
  await failIfScenario()
  const pool = (
    textId ? mockExpressionsFor(textId) : [...MOCK_EXPRESSIONS]
  ).map(withMastery)
  return buildSession(pool, Date.now())
}

export async function listExpressions(): Promise<Expression[]> {
  return MOCK_EXPRESSIONS.map(withMastery)
}

const NEXT_UP: Record<Mastery, Mastery> = {
  new: 'learning',
  learning: 'mastered',
  mastered: 'mastered',
}
const NEXT_DOWN: Record<Mastery, Mastery> = {
  new: 'new',
  learning: 'new',
  mastered: 'learning',
}

export function recordResult(id: string, correct: boolean): void {
  const current = mastery.get(id) ?? 'new'
  mastery.set(id, correct ? NEXT_UP[current] : NEXT_DOWN[current])
}

export function markKnown(id: string): void {
  mastery.set(id, 'mastered')
}

// Counts once per day: finishing a session keeps the streak alive.
export function completeSession(): number {
  if (!practicedToday) {
    practicedToday = true
    streak += 1
  }
  return streak
}

export const getStreak = () => streak

export async function countToLearn(): Promise<number> {
  return (await listExpressions()).filter(e => e.mastery !== 'mastered').length
}
