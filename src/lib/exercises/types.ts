export type ExpressionType =
  | 'phrasal-verb'
  | 'idiom'
  | 'collocation'
  | 'expression'

export type Mastery = 'new' | 'learning' | 'mastered'

export interface Expression {
  id: string
  phrase: string
  type: ExpressionType
  meaning: string
  // Contains `phrase` verbatim, so it can be blanked out for gap exercises.
  example: string
  mastery: Mastery
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
  | MatchExercise

export type ExerciseKind = Exercise['kind']

// A string for single-answer kinds; phrase → chosen meaning for match.
export type Answer = string | Record<string, string>

export interface PracticeSession {
  exercises: Exercise[]
}
