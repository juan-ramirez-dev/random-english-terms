import { modelName, providerName, type AiChoice } from '@/lib/ai/catalog'
import { normalizeText } from '@/lib/exercises/grade'
import {
  parseExercise,
  parseExpressions,
  type ExpressionDraft,
} from '@/lib/exercises/parse'
import { computeStreak, localDay } from '@/lib/exercises/streak'
import type { Exercise, Expression, Mastery } from '@/lib/exercises/types'
import {
  getAnalyzedAt,
  getMastery,
  insertExpressions,
  listExpressions as dbListExpressions,
  markAnalyzed,
  setMastery,
} from '@/lib/local-db/expressions'
import { addPracticeDay, listPracticeDays } from '@/lib/local-db/practice'
import { shuffle } from '@/lib/terms/shuffle'
import { generate, loadChoice, type AiTask } from './ai'
import { ApiClientError } from './http'
import { readText } from './library'

const SESSION_SIZE = 10
// Other expressions the AI sees, to build distractors and match pairs from.
const OTHERS = 6
// An unusable answer gets one more try before the user sees an error.
const RETRIES = 1
const UNUSABLE = new Set(['badResponse', 'invalidModel'])

async function requireChoice(): Promise<AiChoice> {
  const choice = await loadChoice()
  if (!choice) throw new ApiClientError(422, 'noAi')
  return choice
}

// Asks the AI and validates the answer. `parse` returns null for an unusable one;
// `unusable` is what the user sees when every try failed that way.
async function ask<T>(
  choice: AiChoice,
  task: AiTask,
  parse: (raw: unknown) => T | null,
  unusable: ApiClientError,
): Promise<T> {
  let failure: unknown = unusable
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const parsed = parse(await generate(choice, task))
      if (parsed !== null) return parsed
    } catch (error) {
      if (!(error instanceof ApiClientError) || !UNUSABLE.has(error.code)) {
        throw error
      }
      failure = error
    }
  }
  throw failure
}

async function findExpressions(content: string): Promise<ExpressionDraft[]> {
  const choice = await requireChoice()
  return ask(
    choice,
    { kind: 'expressions', text: content },
    raw => {
      const found = parseExpressions(raw)
      return found.length > 0 ? found : null
    },
    new ApiClientError(422, 'noExpressions'),
  )
}

async function analyze(textId: string): Promise<Expression[]> {
  const text = await readText(textId)
  if (!(await getAnalyzedAt(textId))) {
    // Marked only after saving: a failure leaves the text to be read again.
    await insertExpressions(textId, await findExpressions(text.content))
    await markAnalyzed(textId)
  }
  return dbListExpressions(textId)
}

const analyzing = new Map<string, Promise<Expression[]>>()

// The AI reads a text once; after that the expressions come from SQLite.
// Concurrent callers (a double render, Practice + Material) share one call.
export function analyzeText(textId: string): Promise<Expression[]> {
  let running = analyzing.get(textId)
  if (!running) {
    running = analyze(textId).finally(() => analyzing.delete(textId))
    analyzing.set(textId, running)
  }
  return running
}

export const listExpressions = (): Promise<Expression[]> =>
  dbListExpressions(null)

// The same phrase can show up in two texts: the AI should see it once.
function distractorsFor(
  expression: Expression,
  all: readonly Expression[],
  seed: number,
) {
  const taken = new Set([normalizeText(expression.phrase)])
  const unique = all.filter(e => {
    const key = normalizeText(e.phrase)
    if (taken.has(key)) return false
    taken.add(key)
    return true
  })
  return shuffle(unique, seed)
    .slice(0, OTHERS)
    .map(e => ({ phrase: e.phrase, meaning: e.meaning }))
}

async function writeExercise(
  expression: Expression,
  all: readonly Expression[],
  seed: number,
): Promise<Exercise> {
  const choice = await requireChoice()
  const others = distractorsFor(expression, all, seed)
  const { phrase, type, meaning, example } = expression
  return ask(
    choice,
    {
      kind: 'exercise',
      expression: { phrase, type, meaning, example },
      others,
    },
    raw => parseExercise(raw, expression, others, seed),
    new ApiClientError(502, 'badResponse', {
      provider: providerName(choice.provider, modelName(choice)),
    }),
  )
}

export interface Session {
  total: number
  // The exercise at `index`: written by the AI on the first ask, reused after.
  exercise: (index: number) => Promise<Exercise>
  // Starts writing it in the background. A failure shows up when it is asked for.
  prefetch: (index: number) => void
}

// Up to SESSION_SIZE pending expressions of one text, or of all of them.
// No exercise is written here: each one is its own AI call, made when needed.
export async function startSession(textId: string | null): Promise<Session> {
  if (textId) await analyzeText(textId)
  const all = await dbListExpressions(null)
  const scope = textId ? await dbListExpressions(textId) : all
  const seed = Date.now()
  const picked = shuffle(
    scope.filter(e => e.mastery !== 'mastered'),
    seed,
  ).slice(0, SESSION_SIZE)

  const cache = new Map<number, Promise<Exercise>>()
  const exercise = (index: number) => {
    let written = cache.get(index)
    if (!written) {
      written = writeExercise(picked[index], all, seed + index)
      // A failed one is forgotten, so "Try again" asks the AI again.
      written.catch(() => cache.delete(index))
      cache.set(index, written)
    }
    return written
  }
  return {
    total: picked.length,
    exercise,
    prefetch: index => {
      if (index < picked.length) exercise(index).catch(() => {})
    },
  }
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

export async function recordResult(
  id: string,
  correct: boolean,
): Promise<void> {
  const current = (await getMastery(id)) ?? 'new'
  await setMastery(id, correct ? NEXT_UP[current] : NEXT_DOWN[current])
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
