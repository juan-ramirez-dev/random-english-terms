import { modelName, providerName, type AiChoice } from '@/lib/ai/catalog'
import { parseLearned, readJson, type Learned } from '@/lib/exercises/parse'
import type { Expression, PendingPhrase } from '@/lib/exercises/types'
import { insertExercises } from '@/lib/local-db/exercises'
import { insertExpression } from '@/lib/local-db/expressions'
import { generate, loadChoice, type AiTask } from './ai'
import { pendingToLearn } from './exercises'
import { ApiClientError } from './http'

// Meaning, lesson and exercises for what was swiped right.

// An unusable answer gets one more try before the phrase counts as failed.
const RETRIES = 1
const UNUSABLE = new Set(['badResponse', 'invalidModel'])

const isUnusable = (error: unknown) =>
  error instanceof ApiClientError && UNUSABLE.has(error.code)

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

// Asks the AI about one phrase and validates the answer.
async function learnOne(
  choice: AiChoice,
  phrase: PendingPhrase,
  unusable: ApiClientError,
): Promise<Learned> {
  let failure: unknown = unusable
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const [learned] = parseLearned(
        await generate(choice, taskFor([phrase])),
        [phrase],
      )
      if (learned) return learned
    } catch (error) {
      if (!isUnusable(error)) throw error
      failure = error
    }
  }
  throw failure
}

// ---- The AI run: one phrase per call, so each shows up as soon as it's saved.

export interface LearnRun {
  phrases: PendingPhrase[]
  ready: Expression[]
  // Phrases with no usable answer. They stay pending for a later run.
  failed: string[]
  running: boolean
  failure: { error: unknown } | null
}

let latest: LearnRun | null = null
let active: Promise<LearnRun> | null = null
const listeners = new Set<() => void>()

// For useSyncExternalStore: the same object until something changes.
export const getRun = (): LearnRun | null => latest

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

async function learn(): Promise<LearnRun> {
  let run: LearnRun = {
    phrases: [],
    ready: [],
    failed: [],
    running: true,
    failure: null,
  }
  const set = (patch: Partial<LearnRun>) => {
    run = { ...run, ...patch }
    latest = run
    listeners.forEach(listener => listener())
  }
  set({})
  try {
    const choice = await requireChoice()
    const phrases = await pendingToLearn()
    set({ phrases })
    const unusable = new ApiClientError(502, 'badResponse', {
      provider: providerName(choice.provider, modelName(choice)),
    })
    for (const phrase of phrases) {
      try {
        const learned = await learnOne(choice, phrase, unusable)
        await save([learned])
        set({ ready: [...run.ready, learned.expression] })
      } catch (error) {
        // Network, key or model errors would fail every phrase: stop.
        if (!isUnusable(error)) throw error
        set({ failed: [...run.failed, phrase.phrase] })
      }
    }
  } catch (error) {
    set({ failure: { error } })
  }
  set({ running: false })
  return run
}

// A second click while it runs gets the same run.
export function startLearning(): Promise<LearnRun> {
  active ??= learn().finally(() => {
    active = null
  })
  return active
}

// ---- Claude by hand

// Claude's answer, pasted by the user. Phrases that weren't asked for are ignored.
export async function saveFromJson(pasted: string): Promise<number> {
  const raw = readJson(pasted)
  if (raw === null) throw new ApiClientError(422, 'badJson')
  const learned = parseLearned(raw, await pendingToLearn())
  if (learned.length === 0) throw new ApiClientError(422, 'nothingValid')
  await save(learned)
  return learned.length
}
