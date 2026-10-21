import { modelName, providerName, type AiChoice } from '@/lib/ai/catalog'
import { buildMatch } from '@/lib/exercises/build-match'
import { normalizeText } from '@/lib/exercises/grade'
import {
  parseExercise,
  parseLearned,
  readJson,
  type Learned,
} from '@/lib/exercises/parse'
import { computeStreak, localDay } from '@/lib/exercises/streak'
import type {
  Decision,
  Exercise,
  Expression,
  Mastery,
  PendingPhrase,
} from '@/lib/exercises/types'
import {
  listDecided,
  listPending,
  saveDecision,
} from '@/lib/local-db/decisions'
import { insertExercises, listExercises } from '@/lib/local-db/exercises'
import {
  getMastery,
  insertExpression,
  listExpressions as dbListExpressions,
  setMastery,
} from '@/lib/local-db/expressions'
import { addPracticeDay, listPracticeDays } from '@/lib/local-db/practice'
import { findPhrases } from '@/lib/terms/match'
import { shuffle } from '@/lib/terms/shuffle'
import type { FoundPhrase } from '@/lib/terms/types'
import { chatPrompt, generate, loadChoice, type AiTask } from './ai'
import { ApiClientError } from './http'
import { readText } from './library'

const SESSION_SIZE = 10
// Small enough for the local model's context; each batch is saved on its own.
const AI_BATCH = 5
// One paste stays a reasonable size for Claude's answer.
export const CLAUDE_MAX = 30
// An unusable answer gets one more try before the user sees an error.
const RETRIES = 1
const UNUSABLE = new Set(['badResponse', 'invalidModel'])

// ---- Swipe

// Built-in phrases in the text that weren't swiped yet, in this text or another.
export async function swipeQueue(textId: string): Promise<FoundPhrase[]> {
  const text = await readText(textId)
  const decided = new Set(await listDecided())
  return findPhrases(text.content).filter(
    f => !decided.has(normalizeText(f.phrase)),
  )
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

// ---- Learn: meaning, example and exercises for what was swiped right

const taskFor = (pending: readonly PendingPhrase[]): AiTask => ({
  kind: 'learn',
  items: pending.map(({ phrase, type, sentence }) => ({
    phrase,
    type,
    sentence,
  })),
})

async function save(learned: readonly Learned[]): Promise<void> {
  for (const { expression, textId, exercises } of learned) {
    await insertExpression(textId, expression)
    await insertExercises(expression.id, exercises)
  }
}

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

// Batch by batch with the chosen AI. A failure keeps what earlier batches saved.
export async function learnWithAi(): Promise<number> {
  const choice = await requireChoice()
  const pending = await pendingToLearn()
  const unusable = new ApiClientError(502, 'badResponse', {
    provider: providerName(choice.provider, modelName(choice)),
  })
  let saved = 0
  for (let i = 0; i < pending.length; i += AI_BATCH) {
    const batch = pending.slice(i, i + AI_BATCH)
    const learned = await ask(
      choice,
      taskFor(batch),
      raw => {
        const found = parseLearned(raw, batch)
        return found.length > 0 ? found : null
      },
      unusable,
    )
    await save(learned)
    saved += learned.length
  }
  return saved
}

// The prompt for the first CLAUDE_MAX pending phrases.
export async function claudePrompt(): Promise<string> {
  const pending = await pendingToLearn()
  return chatPrompt(taskFor(pending.slice(0, CLAUDE_MAX)))
}

// Claude's answer, pasted by the user. Phrases that weren't asked for are ignored.
export async function saveFromJson(pasted: string): Promise<number> {
  const raw = readJson(pasted)
  if (raw === null) throw new ApiClientError(422, 'badJson')
  const learned = parseLearned(raw, await pendingToLearn())
  if (learned.length === 0) throw new ApiClientError(422, 'nothingValid')
  await save(learned)
  return learned.length
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

// Up to SESSION_SIZE pending expressions of one text, or of all of them.
// One saved exercise each, or a match built from the saved meanings. No AI here.
export async function startSession(textId: string | null): Promise<Exercise[]> {
  const all = await dbListExpressions(null)
  const scope = textId ? await dbListExpressions(textId) : all
  const seed = Date.now()
  const picked = shuffle(
    scope.filter(e => e.mastery !== 'mastered'),
    seed,
  ).slice(0, SESSION_SIZE)
  const rows = await listExercises(picked.map(e => e.id))

  return picked.flatMap((expression, i) => {
    const s = seed + i
    const options: Exercise[] = []
    for (const row of rows) {
      if (row.expressionId !== expression.id) continue
      const data = parseData(row.data)
      const raw = typeof data === 'object' ? { ...data, kind: row.kind } : null
      const exercise = parseExercise(raw, expression, s)
      if (exercise) options.push(exercise)
    }
    const match = buildMatch(expression, all, s)
    if (match) options.push(match)
    return options.length > 0 ? [shuffle(options, s)[0]] : []
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
