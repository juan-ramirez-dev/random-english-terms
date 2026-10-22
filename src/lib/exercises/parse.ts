import { shuffle } from '@/lib/terms/shuffle'
import { normalizeText } from './grade'
import type {
  Exercise,
  Expression,
  Lesson,
  MatchExercise,
  OrderExercise,
  PendingPhrase,
  StoredExercise,
} from './types'

// The AI's JSON is untrusted: nothing reaches the database or the screen without passing here.

type PlainExercise = Exclude<Exercise, MatchExercise | OrderExercise>

// An expression the AI explained, ready to save.
export interface Learned {
  expression: Expression
  textId: string
  exercises: StoredExercise[]
}

const GAP = '___'
const MIN_OPTIONS = 2
const MAX_OPTIONS = 6
const MIN_EXAMPLES = 2

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

const texts = (v: unknown): string[] | null =>
  Array.isArray(v) && v.every(item => typeof item === 'string')
    ? v.map(item => item.trim())
    : null

// ___ (or longer runs of underscores) once, normalized to exactly ___.
function withGap(sentence: string): string | null {
  const gaps = sentence.match(/_{3,}/g)
  return gaps?.length === 1 ? sentence.replace(/_{3,}/, GAP) : null
}

// Distinct options, as the AI wrote them.
function uniqueOptions(options: string[] | null): string[] | null {
  if (!options) return null
  const unique = new Map(options.map(o => [normalizeText(o), o]))
  const list = [...unique.values()].filter(Boolean)
  const size = list.length
  return size >= MIN_OPTIONS && size <= MAX_OPTIONS ? list : null
}

const sameText = (a: string, b: string) => normalizeText(a) === normalizeText(b)

// Usage and at least two examples, or the lesson teaches nothing. A missing dialog is fine.
export function parseLesson(raw: unknown): Lesson | null {
  if (!isObject(raw)) return null
  const usage = text(raw.usage)
  const examples = (texts(raw.examples) ?? []).filter(Boolean)
  if (!usage || examples.length < MIN_EXAMPLES) return null
  return {
    usage,
    translation: text(raw.translation),
    examples,
    dialog: (texts(raw.dialog) ?? []).filter(Boolean),
  }
}

// One exercise for `expression`. null = the AI's answer is not usable.
export function parseExercise(
  raw: unknown,
  expression: Expression,
  seed: number,
): PlainExercise | null {
  if (!isObject(raw)) return null
  const base = { id: `${expression.id}-${String(raw.kind)}`, expression }
  const sentence = text(raw.sentence)
  const answer = text(raw.answer)

  switch (raw.kind) {
    case 'multiple-choice': {
      const options = uniqueOptions(texts(raw.options))
      // The answer must be this expression's meaning, or the grade would be about another one.
      const right = options?.find(o => sameText(o, answer))
      if (!options || !right || !sameText(right, expression.meaning)) {
        return null
      }
      return {
        ...base,
        kind: 'multiple-choice',
        answer: right,
        options: shuffle(options, seed),
      }
    }
    case 'fill-gap': {
      const gapped = withGap(sentence)
      if (!gapped || !sameText(answer, expression.phrase)) return null
      return {
        ...base,
        kind: 'fill-gap',
        sentence: gapped,
        answer: expression.phrase,
      }
    }
    case 'context': {
      const gapped = withGap(sentence)
      const options = uniqueOptions(texts(raw.options))
      const right = options?.find(o => sameText(o, expression.phrase))
      if (!gapped || !options || !right || !sameText(answer, right)) return null
      return {
        ...base,
        kind: 'context',
        sentence: gapped,
        answer: right,
        options: shuffle(options, seed),
      }
    }
    case 'usage': {
      const options = uniqueOptions(texts(raw.options))
      const right = options?.find(o => sameText(o, answer))
      if (!options || !right) return null
      return {
        ...base,
        kind: 'usage',
        answer: right,
        options: shuffle(options, seed),
      }
    }
    default:
      return null
  }
}

const toStored = (e: PlainExercise): StoredExercise => ({
  kind: e.kind,
  sentence: e.kind === 'fill-gap' || e.kind === 'context' ? e.sentence : '',
  options: e.kind === 'fill-gap' ? [] : e.options,
  answer: e.answer,
})

const tryParse = (json: string): unknown => {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

// Claude wraps its answer in ```json … ``` or adds a line before it: keep the object only.
// Copying through some apps turns " into “ ”: straighten them only if it doesn't parse as is.
export function readJson(pasted: string): unknown {
  const start = pasted.indexOf('{')
  const end = pasted.lastIndexOf('}')
  if (start === -1 || end < start) return null
  const json = pasted.slice(start, end + 1)
  return tryParse(json) ?? tryParse(json.replace(/[“”„‟″]/g, '"'))
}

// Only the phrases that were asked for, each once. One needs at least one valid exercise.
export function parseLearned(
  raw: unknown,
  pending: readonly PendingPhrase[],
): Learned[] {
  if (!isObject(raw) || !Array.isArray(raw.expressions)) return []
  const wanted = new Map(pending.map(p => [normalizeText(p.phrase), p]))
  const learned: Learned[] = []
  for (const item of raw.expressions) {
    if (!isObject(item) || !Array.isArray(item.exercises)) continue
    const key = normalizeText(text(item.phrase))
    const asked = wanted.get(key)
    const meaning = text(item.meaning)
    const lesson = parseLesson(item)
    if (!asked || !meaning || !lesson) continue
    wanted.delete(key)
    const expression: Expression = {
      id: crypto.randomUUID(),
      phrase: asked.phrase,
      type: asked.type,
      meaning,
      example: lesson.examples[0],
      lesson,
      mastery: 'new',
    }
    const exercises = item.exercises
      .map(e => parseExercise(e, expression, 1))
      .filter(e => e !== null)
      .map(toStored)
    if (exercises.length === 0) continue
    learned.push({ expression, textId: asked.textId, exercises })
  }
  return learned
}
