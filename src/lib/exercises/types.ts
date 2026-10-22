export type ExpressionType =
  | 'phrasal-verb'
  | 'idiom'
  | 'collocation'
  | 'expression'

export type Mastery = 'new' | 'learning' | 'mastered'

// What the person reads before the first exercise. Written by the AI.
export interface Lesson {
  usage: string
  translation: string
  examples: string[]
  // "A: …" / "B: …" lines. Can be empty.
  dialog: string[]
}

export interface Expression {
  id: string
  phrase: string
  type: ExpressionType
  meaning: string
  // The lesson's first example.
  example: string
  lesson: Lesson
  mastery: Mastery
}

// ← = known, → = learn.
export type Decision = 'known' | 'learn'

// A phrase swiped to the right that has no meaning or exercises yet.
export interface PendingPhrase {
  phrase: string
  type: ExpressionType
  sentence: string
  textId: string
}

interface BaseExercise {
  id: string
  expression: Expression
}

export interface MultipleChoiceExercise extends BaseExercise {
  kind: 'multiple-choice'
  // Options are meanings; the prompt is the expression itself.
  options: string[]
  answer: string
}

export interface FillGapExercise extends BaseExercise {
  kind: 'fill-gap'
  sentence: string
  answer: string
}

export interface ContextExercise extends BaseExercise {
  kind: 'context'
  sentence: string
  options: string[]
  answer: string
}

// Options are sentences; only one uses the phrase right.
export interface UsageExercise extends BaseExercise {
  kind: 'usage'
  options: string[]
  answer: string
}

// The words of an example, shuffled, to put back in order.
export interface OrderExercise extends BaseExercise {
  kind: 'order'
  words: string[]
  answer: string
}

export interface MatchPair {
  phrase: string
  meaning: string
}

export interface MatchExercise extends BaseExercise {
  kind: 'match'
  pairs: MatchPair[]
  // Meanings in display order (shuffled).
  meanings: string[]
}

export type Exercise =
  | MultipleChoiceExercise
  | FillGapExercise
  | ContextExercise
  | UsageExercise
  | MatchExercise
  | OrderExercise

export type ExerciseKind = Exercise['kind']

// What the AI writes and SQLite keeps. `match` and `order` are built locally.
export type StoredKind = Exclude<ExerciseKind, 'match' | 'order'>

// A session is a list of these: a phrase's lesson, then its exercises.
export type SessionStep =
  | { kind: 'lesson'; id: string; expression: Expression }
  | Exercise

export interface StoredExercise {
  kind: StoredKind
  sentence: string
  options: string[]
  answer: string
}

// A string for single-answer kinds; phrase → chosen meaning for match.
export type Answer = string | Record<string, string>
