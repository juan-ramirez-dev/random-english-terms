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
  generateSession,
  markKnown,
  recordResult,
} from '@/lib/api-client/exercises'
import { usePreferences } from '@/lib/i18n/context'
import type { PracticeSession } from '@/lib/exercises/types'
import { NoAi } from '../no-ai'
import { useSelectedText } from '../selected-text-provider'
import { ExerciseView } from './exercise-view'
import styles from './practice.module.css'

interface Loaded {
  key: string
  session: PracticeSession | null
  failure: { error: unknown } | null
}

export default function PracticePage() {
  const { t, error: errorText } = usePreferences()
  const router = useRouter()
  const { selected } = useSelectedText()
  const [hasAi, setHasAi] = useState<boolean | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState<number | null>(null)

  const textId = selected?.id ?? null
  const key = `${textId}:${attempt}`

  // setState lives in the .then callbacks, not synchronously in the effect.
  useEffect(() => {
    loadChoice().then(choice => setHasAi(choice !== null))
  }, [])

  useEffect(() => {
    if (!hasAi) return
    let cancelled = false
    generateSession(textId).then(
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

  const restart = () => {
    setIndex(0)
    setCorrect(0)
    setStreak(null)
    setAttempt(a => a + 1)
  }

  const current = loaded?.key === key ? loaded : null
  const exercises = current?.session?.exercises ?? []
  const total = exercises.length
  const exercise = exercises[index]
  const done = total > 0 && index >= total

  const onAnswered = (id: string, ok: boolean) => {
    recordResult(id, ok)
    if (ok) setCorrect(c => c + 1)
  }

  const onKnown = (id: string) => {
    markKnown(id)
    setCorrect(c => c + 1)
    onNext()
  }

  const onNext = () => {
    if (index + 1 >= total) setStreak(completeSession())
    setIndex(i => i + 1)
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

      {current?.session && total === 0 && (
        <Card className={styles.center}>
          <p className={styles.title}>{t.practice.nothing}</p>
          <p className={styles.hint}>{t.practice.nothingHint}</p>
          <Button onClick={() => router.push('/material/')}>
            {t.practice.goMaterial}
          </Button>
        </Card>
      )}

      {exercise && (
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
          <ExerciseView
            key={exercise.id}
            exercise={exercise}
            last={index + 1 >= total}
            onAnswered={ok => onAnswered(exercise.expression.id, ok)}
            onNext={onNext}
            onKnown={() => onKnown(exercise.expression.id)}
          />
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
