'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { grade } from '@/lib/exercises/grade'
import type {
  Answer,
  Exercise,
  MatchExercise,
  OrderExercise,
} from '@/lib/exercises/types'
import { usePreferences } from '@/lib/i18n/context'
import styles from './exercise-view.module.css'

interface Props {
  exercise: Exercise
  last: boolean
  onAnswered: (correct: boolean) => void
  onNext: () => void
  onKnown: () => void
}

// One exercise: collect the answer, grade it, show feedback, wait for "next".
export function ExerciseView({
  exercise,
  last,
  onAnswered,
  onNext,
  onKnown,
}: Props) {
  const { t } = usePreferences()
  const [result, setResult] = useState<{ correct: boolean } | null>(null)

  const submit = (answer: Answer) => {
    if (result) return
    const correct = grade(exercise, answer)
    setResult({ correct })
    onAnswered(correct)
  }

  const { expression } = exercise

  return (
    <Card className={styles.card}>
      <p className={styles.kind}>{t.practice.kinds[exercise.kind]}</p>

      {(exercise.kind === 'multiple-choice' || exercise.kind === 'usage') && (
        <>
          <p className={styles.prompt}>{expression.phrase}</p>
          <Options
            options={exercise.options}
            answer={exercise.answer}
            checked={result !== null}
            onPick={submit}
          />
        </>
      )}

      {exercise.kind === 'context' && (
        <>
          <p className={styles.sentence}>{exercise.sentence}</p>
          <Options
            options={exercise.options}
            answer={exercise.answer}
            checked={result !== null}
            onPick={submit}
          />
        </>
      )}

      {exercise.kind === 'fill-gap' && (
        <FillGap
          sentence={exercise.sentence}
          hint={expression.meaning}
          disabled={result !== null}
          onSubmit={submit}
        />
      )}

      {exercise.kind === 'match' && (
        <Match exercise={exercise} checked={result} onSubmit={submit} />
      )}

      {exercise.kind === 'order' && (
        <Order exercise={exercise} checked={result} onSubmit={submit} />
      )}

      {!result && (
        <Button variant="ghost" onClick={onKnown}>
          {t.practice.alreadyKnow}
        </Button>
      )}

      {result && (
        <div
          className={`${styles.feedback} ${result.correct ? styles.good : styles.bad}`}
          role="status"
        >
          <p className={styles.feedbackTitle}>
            <Icon name={result.correct ? 'check' : 'close'} size={20} />
            {result.correct ? t.practice.correct : t.practice.wrong}
          </p>
          {!result.correct && exercise.kind !== 'match' && (
            <p>{t.practice.answerWas(exercise.answer)}</p>
          )}
          <p className={styles.explain}>
            <strong>{expression.phrase}</strong> — {expression.meaning}
          </p>
          <p className={styles.explain}>{expression.example}</p>
          <Button onClick={onNext}>
            {last ? t.practice.finish : t.practice.next}
          </Button>
        </div>
      )}
    </Card>
  )
}

function Options({
  options,
  answer,
  checked,
  onPick,
}: {
  options: string[]
  answer: string
  checked: boolean
  onPick: (value: string) => void
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const state = (option: string) => {
    if (!checked) return undefined
    if (option === answer) return styles.right
    if (option === picked) return styles.wrong
    return styles.dim
  }
  return (
    <div className={styles.options}>
      {options.map(option => (
        <button
          key={option}
          type="button"
          className={`${styles.option} ${state(option) ?? ''}`}
          disabled={checked}
          onClick={() => {
            setPicked(option)
            onPick(option)
          }}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

function FillGap({
  sentence,
  hint,
  disabled,
  onSubmit,
}: {
  sentence: string
  hint: string
  disabled: boolean
  onSubmit: (value: string) => void
}) {
  const { t } = usePreferences()
  const [value, setValue] = useState('')
  return (
    <form
      className={styles.gap}
      onSubmit={e => {
        e.preventDefault()
        if (value.trim()) onSubmit(value)
      }}
    >
      <p className={styles.sentence}>{sentence}</p>
      <p className={styles.hint}>{hint}</p>
      <input
        className={styles.input}
        value={value}
        placeholder={t.practice.typeHere}
        disabled={disabled}
        autoFocus
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        onChange={e => setValue(e.target.value)}
      />
      {!disabled && (
        <Button type="submit" disabled={!value.trim()}>
          {t.practice.check}
        </Button>
      )}
    </form>
  )
}

function Match({
  exercise,
  checked,
  onSubmit,
}: {
  exercise: MatchExercise
  checked: { correct: boolean } | null
  onSubmit: (answer: Record<string, string>) => void
}) {
  const { t } = usePreferences()
  const [phrase, setPhrase] = useState<string | null>(null)
  const [pairs, setPairs] = useState<Record<string, string>>({})
  const locked = checked !== null
  const taken = new Set(Object.values(pairs))
  const complete = Object.keys(pairs).length === exercise.pairs.length

  const pickMeaning = (meaning: string) => {
    if (locked || !phrase || taken.has(meaning)) return
    setPairs(p => ({ ...p, [phrase]: meaning }))
    setPhrase(null)
  }

  const unpair = (target: string) => {
    if (locked) return
    setPairs(({ [target]: _removed, ...rest }) => rest)
    setPhrase(target)
  }

  const pairState = (target: string) => {
    if (!locked) return undefined
    const right = exercise.pairs.find(p => p.phrase === target)?.meaning
    return pairs[target] === right ? styles.right : styles.wrong
  }

  return (
    <div className={styles.match}>
      <p className={styles.hint}>{t.practice.pickMeaning}</p>
      <div className={styles.columns}>
        <div className={styles.column}>
          {exercise.pairs.map(pair => (
            <button
              key={pair.phrase}
              type="button"
              className={`${styles.option} ${phrase === pair.phrase ? styles.active : ''} ${pairState(pair.phrase) ?? ''}`}
              onClick={() =>
                pair.phrase in pairs
                  ? unpair(pair.phrase)
                  : setPhrase(pair.phrase)
              }
              disabled={locked}
            >
              {pair.phrase}
              {pairs[pair.phrase] && (
                <span className={styles.paired}>{pairs[pair.phrase]}</span>
              )}
            </button>
          ))}
        </div>
        <div className={styles.column}>
          {exercise.meanings.map(meaning => (
            <button
              key={meaning}
              type="button"
              className={`${styles.option} ${taken.has(meaning) ? styles.dim : ''}`}
              onClick={() => pickMeaning(meaning)}
              disabled={locked || taken.has(meaning)}
            >
              {meaning}
            </button>
          ))}
        </div>
      </div>
      {!locked && (
        <Button disabled={!complete} onClick={() => onSubmit(pairs)}>
          {t.practice.check}
        </Button>
      )}
    </div>
  )
}

function Order({
  exercise,
  checked,
  onSubmit,
}: {
  exercise: OrderExercise
  checked: { correct: boolean } | null
  onSubmit: (answer: string) => void
}) {
  const { t } = usePreferences()
  // Indexes into `words`: a sentence can repeat a word.
  const [picked, setPicked] = useState<number[]>([])
  const locked = checked !== null
  const complete = picked.length === exercise.words.length
  const sentence = picked.map(i => exercise.words[i]).join(' ')

  return (
    <div className={styles.match}>
      <p className={styles.hint}>{t.practice.orderHint}</p>
      <div
        className={`${styles.built} ${locked ? (checked.correct ? styles.right : styles.wrong) : ''}`}
      >
        {picked.map(i => (
          <button
            key={i}
            type="button"
            className={styles.word}
            disabled={locked}
            onClick={() => setPicked(p => p.filter(k => k !== i))}
          >
            {exercise.words[i]}
          </button>
        ))}
      </div>
      <div className={styles.words}>
        {exercise.words.map((word, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.word} ${picked.includes(i) ? styles.dim : ''}`}
            disabled={locked || picked.includes(i)}
            onClick={() => setPicked(p => [...p, i])}
          >
            {word}
          </button>
        ))}
      </div>
      {!locked && (
        <Button disabled={!complete} onClick={() => onSubmit(sentence)}>
          {t.practice.check}
        </Button>
      )}
    </div>
  )
}
