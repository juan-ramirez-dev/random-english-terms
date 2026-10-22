'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { ProgressRing } from '@/components/ui/progress-ring'
import {
  completeSession,
  markKnown,
  recordPhrase,
  startSession,
} from '@/lib/api-client/exercises'
import { getRun, subscribe } from '@/lib/api-client/learn'
import { usePreferences } from '@/lib/i18n/context'
import type { SessionStep } from '@/lib/exercises/types'
import { useSelectedText } from '../selected-text-provider'
import { ExerciseView } from './exercise-view'
import { LessonCard } from './lesson-card'
import styles from './practice.module.css'

interface Loaded {
  key: string
  steps: SessionStep[]
  failure: { error: unknown } | null
}

// Where the next phrase starts, or the end of the session.
const nextPhrase = (steps: SessionStep[], from: number) => {
  const id = steps[from]?.expression.id
  const at = steps.findIndex((s, i) => i > from && s.expression.id !== id)
  return at === -1 ? steps.length : at
}

// A saved result that failed to write must not stop the lesson.
const logFailure = (error: unknown) =>
  console.error('Could not save your progress', error)

const noRun = () => null

export default function PracticePage() {
  const { t, error: errorText } = usePreferences()
  const router = useRouter()
  const { selected } = useSelectedText()
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  // Wrong answers of the phrase on screen. Saved once its last step is done.
  const [wrong, setWrong] = useState(0)
  const [streak, setStreak] = useState<number | null>(null)
  // The AI may still be writing phrases started from Material.
  const learning = useSyncExternalStore(subscribe, getRun, noRun)

  const textId = selected?.id ?? null
  const key = `${textId}:${attempt}`

  // setState lives in the .then callbacks, not synchronously in the effect.
  useEffect(() => {
    let cancelled = false
    startSession(textId).then(
      steps => {
        if (!cancelled) setLoaded({ key, steps, failure: null })
      },
      (e: unknown) => {
        if (!cancelled) setLoaded({ key, steps: [], failure: { error: e } })
      },
    )
    return () => {
      cancelled = true
    }
  }, [textId, key])

  const current = loaded?.key === key ? loaded : null
  const steps = current && !current.failure ? current.steps : null
  const total = steps?.length ?? 0
  const graded = steps?.filter(s => s.kind !== 'lesson').length ?? 0

  const restart = () => {
    setIndex(0)
    setCorrect(0)
    setWrong(0)
    setStreak(null)
    setAttempt(a => a + 1)
  }

  const step = steps?.[index] ?? null
  const done = total > 0 && index >= total

  const goTo = (to: number) => {
    if (to >= total) completeSession().then(setStreak, logFailure)
    setIndex(to)
  }

  const onAnswered = (ok: boolean) => {
    if (ok) setCorrect(c => c + 1)
    else setWrong(w => w + 1)
  }

  const onNext = () => {
    if (!steps || !step) return
    const to = index + 1
    if (to === nextPhrase(steps, index)) {
      recordPhrase(step.expression.id, wrong).catch(logFailure)
      setWrong(0)
    }
    goTo(to)
  }

  // Its remaining exercises count as right.
  const onKnown = () => {
    if (!steps || !step) return
    const to = nextPhrase(steps, index)
    markKnown(step.expression.id).catch(logFailure)
    setCorrect(c => c + steps.slice(index, to).length)
    setWrong(0)
    goTo(to)
  }

  return (
    <main className={styles.page}>
      {learning?.running && learning.phrases.length > 0 && (
        <p className={styles.coming}>
          <span className={styles.dot} />
          {t.practice.moreComing(
            learning.ready.length,
            learning.phrases.length,
          )}
        </p>
      )}

      {!current && (
        <Card className={styles.center}>
          <span className={styles.spinner} />
          <p className={styles.title}>{t.practice.building}</p>
        </Card>
      )}

      {current?.failure && (
        <Card className={styles.center}>
          <p className={styles.title}>{errorText(current.failure.error)}</p>
          <Button variant="soft" onClick={restart}>
            {t.practice.retry}
          </Button>
        </Card>
      )}

      {steps && total === 0 && (
        <Card className={styles.center}>
          <p className={styles.title}>{t.practice.nothing}</p>
          <p className={styles.hint}>{t.practice.nothingHint}</p>
          <Button onClick={() => router.push('/material/')}>
            {t.practice.goMaterial}
          </Button>
        </Card>
      )}

      {steps && total > 0 && !done && (
        <>
          <header className={styles.header}>
            <button
              type="button"
              className={styles.quit}
              onClick={() => router.push('/')}
              aria-label={t.practice.quit}
            >
              <Icon name="close" size={20} />
            </button>
            <ProgressRing
              value={index}
              max={total}
              label={t.practice.step(index + 1, total)}
            />
          </header>

          {step?.kind === 'lesson' && (
            <LessonCard
              key={step.id}
              expression={step.expression}
              onNext={onNext}
            />
          )}

          {step && step.kind !== 'lesson' && (
            <ExerciseView
              key={step.id}
              exercise={step}
              last={index + 1 >= total}
              onAnswered={onAnswered}
              onNext={onNext}
              onKnown={onKnown}
            />
          )}
        </>
      )}

      {done && (
        <Card className={styles.center}>
          <span className={styles.trophy}>
            <Icon name="star" size={36} />
          </span>
          <p className={styles.doneTitle}>{t.practice.doneTitle}</p>
          <p className={styles.score}>{t.practice.score(correct, graded)}</p>
          {streak !== null && (
            <span className={styles.streak}>
              <Icon name="flame" size={18} />
              {t.practice.streak(streak)}
            </span>
          )}
          <div className={styles.actions}>
            <Button variant="soft" onClick={restart}>
              {t.practice.again}
            </Button>
            <Button onClick={() => router.push('/')}>
              {t.practice.backHome}
            </Button>
          </div>
        </Card>
      )}
    </main>
  )
}
