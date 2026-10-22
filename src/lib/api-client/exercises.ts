import { buildMatch } from '@/lib/exercises/build-match'
import { buildOrder } from '@/lib/exercises/build-order'
import { normalizeText } from '@/lib/exercises/grade'
import { parseExercise } from '@/lib/exercises/parse'
import { computeStreak, localDay } from '@/lib/exercises/streak'
import type {
  Decision,
  Exercise,
  ExerciseKind,
  Expression,
  Mastery,
  PendingPhrase,
  SessionStep,
} from '@/lib/exercises/types'
import {
  listDecided,
  listPending,
  saveDecision,
} from '@/lib/local-db/decisions'
import { listExercises } from '@/lib/local-db/exercises'
import {
  getMastery,
  listExpressions as dbListExpressions,
  setMastery,
} from '@/lib/local-db/expressions'
import { addPracticeDay, listPracticeDays } from '@/lib/local-db/practice'
import { BUILT_IN, findPhrases } from '@/lib/terms/match'
import { shuffle } from '@/lib/terms/shuffle'
import type { FoundPhrase } from '@/lib/terms/types'
import { readText } from './library'

// Each phrase brings a lesson and about 6 exercises.
const SESSION_SIZE = 5
// Enough cards to keep about 15 even from a short text.
const QUEUE_SIZE = 50

// ---- Swipe

// Built-in phrases not swiped yet, in this text or another.
// The text's own come first; random ones from the list fill up to QUEUE_SIZE.
export async function swipeQueue(textId: string): Promise<FoundPhrase[]> {
  const text = await readText(textId)
  const decided = new Set(await listDecided())
  const fresh = (phrase: string) => !decided.has(normalizeText(phrase))
  const inText = findPhrases(text.content).filter(f => fresh(f.phrase))
  const shown = new Set(inText.map(f => f.phrase))
  const extras = shuffle(
    BUILT_IN.filter(p => fresh(p.phrase) && !shown.has(p.phrase)),
    Date.now(),
  )
    .slice(0, Math.max(0, QUEUE_SIZE - inText.length))
    .map(p => ({ ...p, sentence: '' }))
  return [...inText, ...extras]
}

// Swipes save in the background so the next card shows at once.
// Reading what's pending waits for them.
let saving: Promise<unknown> = Promise.resolve()

export function decide(
  found: FoundPhrase,
  textId: string,
  decision: Decision,
): Promise<void> {
  const write = saveDecision({ ...found, textId, decision })
  saving = Promise.allSettled([saving, write])
  return write
}

export async function pendingToLearn(): Promise<PendingPhrase[]> {
  await saving
  return listPending()
}

// ---- Practice

export const listExpressions = (): Promise<Expression[]> =>
  dbListExpressions(null)

export const listTextExpressions = (textId: string): Promise<Expression[]> =>
  dbListExpressions(textId)

const parseData = (data: string): unknown => {
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

// Easiest first: recognize the meaning, then pick the phrase, then write it.
const EASIEST_FIRST: ExerciseKind[] = [
  'multiple-choice',
  'match',
  'context',
  'usage',
  'order',
  'fill-gap',
]

// Up to SESSION_SIZE pending expressions of one text, or of all of them.
// Each one: its lesson while it's new, then every exercise it has. No AI here.
export async function startSession(
  textId: string | null,
): Promise<SessionStep[]> {
  const all = await dbListExpressions(null)
  const scope = textId ? await dbListExpressions(textId) : all
  const seed = Date.now()
  const picked = shuffle(
    scope.filter(e => e.mastery !== 'mastered'),
    seed,
  ).slice(0, SESSION_SIZE)
  const rows = await listExercises(picked.map(e => e.id))

  return picked.flatMap((expression, i): SessionStep[] => {
    const s = seed + i
    // One per kind: the step ids are built from it.
    const byKind = new Map<ExerciseKind, Exercise>()
    const add = (exercise: Exercise | null) => {
      if (exercise && !byKind.has(exercise.kind)) {
        byKind.set(exercise.kind, exercise)
      }
    }
    for (const row of rows) {
      if (row.expressionId !== expression.id) continue
      const data = parseData(row.data)
      const raw = typeof data === 'object' ? { ...data, kind: row.kind } : null
      add(parseExercise(raw, expression, s))
    }
    add(buildMatch(expression, all, s))
    add(buildOrder(expression, s))
    const exercises = EASIEST_FIRST.flatMap(kind => byKind.get(kind) ?? [])
    if (exercises.length === 0) return []
    if (expression.mastery !== 'new') return exercises
    const lesson = { kind: 'lesson' as const, id: `${expression.id}-lesson` }
    return [{ ...lesson, expression }, ...exercises]
  })
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

// This many wrong answers in a session and the phrase goes down a level.
const DROP_AT = 2

// Once per phrase per session, so one session can't take it from new to mastered.
export async function recordPhrase(id: string, wrong: number): Promise<void> {
  const current = (await getMastery(id)) ?? 'new'
  if (wrong === 0) await setMastery(id, NEXT_UP[current])
  else if (wrong >= DROP_AT) await setMastery(id, NEXT_DOWN[current])
}

export const markKnown = (id: string): Promise<void> =>
  setMastery(id, 'mastered')

export async function getStreak(): Promise<number> {
  return computeStreak(await listPracticeDays(), localDay(new Date()))
}

// Finishing a session counts the day once; the streak is computed from the days.
export async function completeSession(): Promise<number> {
  await addPracticeDay(localDay(new Date()))
  return getStreak()
}
