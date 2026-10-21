'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { ProgressRing } from '@/components/ui/progress-ring'
import { loadChoice } from '@/lib/api-client/ai'
import {
  completeSession,
  markKnown,
  recordResult,
  startSession,
  type Session,
} from '@/lib/api-client/exercises'
import { usePreferences } from '@/lib/i18n/context'
import type { Exercise } from '@/lib/exercises/types'
import { NoAi } from '../no-ai'
import { useSelectedText } from '../selected-text-provider'
import { ExerciseView } from './exercise-view'
import styles from './practice.module.css'

interface Loaded {
  key: string
  session: Session | null
  failure: { error: unknown } | null
}

interface Slot {
  key: string
  exercise: Exercise | null
  failure: { error: unknown } | null
}

// A saved result that failed to write must not stop the lesson.
const logFailure = (error: unknown) =>
  console.error('Could not save your progress', error)

export default function PracticePage() {
  const { t, error: errorText } = usePreferences()
  const router = useRouter()
  const { selected } = useSelectedText()
  const [hasAi, setHasAi] = useState<boolean | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [tries, setTries] = useState(0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState<number | null>(null)

  const textId = selected?.id ?? null
  const key = `${textId}:${attempt}`
  const slotKey = `${key}:${index}:${tries}`

  // setState lives in the .then callbacks, not synchronously in the effects.
  useEffect(() => {
    loadChoice().then(choice => setHasAi(choice !== null))
  }, [])

  useEffect(() => {
    if (!hasAi) return
    let cancelled = false
    startSession(textId).then(
      session => {
        if (!cancelled) setLoaded({ key, session, failure: null })
      },
      (e: unknown) => {
        if (!cancelled) setLoaded({ key, session: null, failure: { error: e } })
      },
    )
    return () => {
      cancelled = true
    }
  }, [hasAi, textId, key])

  const current = loaded?.key === key ? loaded : null
  const session = current?.session ?? null
  const total = session?.total ?? 0

  // One exercise at a time: the next one is written while this one is answered.
  useEffect(() => {
    if (!session || index >= session.total) return
    let cancelled = false
    session.exercise(index).then(
      exercise => {
        if (cancelled) return
        setSlot({ key: slotKey, exercise, failure: null })
        session.prefetch(index + 1)
      },
      (e: unknown) => {
        if (!cancelled)
          setSlot({ key: slotKey, exercise: null, failure: { error: e } })
      },
    )
    return () => {
      cancelled = true
    }
  }, [session, index, slotKey])

  const restart = () => {
    setIndex(0)
    setCorrect(0)
    setStreak(null)
    setTries(0)
    setAttempt(a => a + 1)
  }

  const currentSlot = slot?.key === slotKey ? slot : null
  const exercise = currentSlot?.exercise ?? null
  const done = total > 0 && index >= total
  const writing = session !== null && !done && !currentSlot

  const onAnswered = (id: string, ok: boolean) => {
    recordResult(id, ok).catch(logFailure)
    if (ok) setCorrect(c => c + 1)
  }

  const onKnown = (id: string) => {
    markKnown(id).catch(logFailure)
    setCorrect(c => c + 1)
    onNext()
  }

  const onNext = () => {
    if (index + 1 >= total) completeSession().then(setStreak, logFailure)
    setIndex(i => i + 1)
    setTries(0)
  }

  return (
    <main className={styles.page}>
      {hasAi === false && <NoAi />}

      {hasAi && !current && (
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

      {session && total === 0 && (
        <Card className={styles.center}>
          <p className={styles.title}>{t.practice.nothing}</p>
          <p className={styles.hint}>{t.practice.nothingHint}</p>
          <Button onClick={() => router.push('/material/')}>
            {t.practice.goMaterial}
          </Button>
        </Card>
      )}

      {session && total > 0 && !done && (
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

          {writing && (
            <Card className={styles.center}>
              <span className={styles.spinner} />
              <p className={styles.title}>{t.practice.preparing}</p>
            </Card>
          )}

          {currentSlot?.failure && (
            <Card className={styles.center}>
              <p className={styles.title}>
                {errorText(currentSlot.failure.error)}
              </p>
              <Button variant="soft" onClick={() => setTries(n => n + 1)}>
                {t.practice.retry}
              </Button>
            </Card>
          )}

          {exercise && (
            <ExerciseView
              key={exercise.id}
              exercise={exercise}
              last={index + 1 >= total}
              onAnswered={ok => onAnswered(exercise.expression.id, ok)}
              onNext={onNext}
              onKnown={() => onKnown(exercise.expression.id)}
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
          <p className={styles.score}>{t.practice.score(correct, total)}</p>
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
