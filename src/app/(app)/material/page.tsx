'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { loadChoice } from '@/lib/api-client/ai'
import {
  decide,
  listTextExpressions,
  pendingToLearn,
  swipeQueue,
} from '@/lib/api-client/exercises'
import { deleteText, listTexts } from '@/lib/api-client/library'
import type { Decision, Expression } from '@/lib/exercises/types'
import { usePreferences } from '@/lib/i18n/context'
import type { FoundPhrase, TextSummary } from '@/lib/terms/types'
import { useSelectedText } from '../selected-text-provider'
import { LearnPanel } from './learn-panel'
import styles from './material.module.css'
import { SwipeCard } from './swipe-card'

interface Loaded {
  key: string
  queue: FoundPhrase[]
  pending: number
  expressions: Expression[]
  failure: { error: unknown } | null
}

// Where the user is in the queue of the loaded text.
interface Step {
  key: string
  index: number
  picked: number
  panel: boolean
}

// A new text (or a reload) starts the queue over.
const stepFor = (step: Step | null, key: string): Step =>
  step?.key === key ? step : { key, index: 0, picked: 0, panel: false }

// A swipe that failed to save comes back next time: it must not stop the round.
const logFailure = (error: unknown) =>
  console.error('Could not save your choice', error)

export default function MaterialPage() {
  const { t, error: errorText } = usePreferences()
  const router = useRouter()
  const { selected, select, clear } = useSelectedText()
  const [texts, setTexts] = useState<TextSummary[] | null>(null)
  const [hasAi, setHasAi] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [step, setStep] = useState<Step | null>(null)

  // setState lives in the .then callback, not synchronously in the effect.
  const load = useCallback(() => listTexts().then(setTexts), [])

  useEffect(() => {
    load()
    loadChoice().then(choice => setHasAi(choice !== null))
  }, [load])

  const key = selected ? `${selected.id}:${attempt}` : null
  const id = selected?.id

  useEffect(() => {
    if (!id || !key) return
    let cancelled = false
    Promise.all([
      swipeQueue(id),
      pendingToLearn(),
      listTextExpressions(id),
    ]).then(
      ([queue, pending, expressions]) => {
        if (cancelled) return
        setLoaded({
          key,
          queue,
          pending: pending.length,
          expressions,
          failure: null,
        })
      },
      (e: unknown) => {
        if (cancelled) return
        setLoaded({
          key,
          queue: [],
          pending: 0,
          expressions: [],
          failure: { error: e },
        })
      },
    )
    return () => {
      cancelled = true
    }
  }, [id, key])

  const current = loaded?.key === key ? loaded : null
  const stepKey = key ?? ''
  const at = stepFor(step, stepKey)
  const found = current?.queue[at.index]

  // Reads the latest step instead of closing over it.
  const advance = useCallback(
    (picked: number) =>
      setStep(s => {
        const base = stepFor(s, stepKey)
        return { ...base, index: base.index + 1, picked: base.picked + picked }
      }),
    [stepKey],
  )

  const onDecide = useCallback(
    (decision: Decision) => {
      if (!found || !id) return
      decide(found, id, decision).catch(logFailure)
      advance(decision === 'learn' ? 1 : 0)
    },
    [found, id, advance],
  )

  const onSkip = useCallback(() => advance(0), [advance])

  const remove = async (textId: string) => {
    await deleteText(textId)
    load()
  }

  // ---- One text open
  if (selected) {
    const total = current?.queue.length ?? 0
    const left = total - at.index
    const pending = (current?.pending ?? 0) + at.picked
    const swiping = left > 0 && !at.panel
    return (
      <main className={styles.page}>
        <button type="button" className={styles.back} onClick={clear}>
          <Icon name="arrowLeft" size={16} />
          {t.material.all}
        </button>
        <header className={styles.header}>
          <h1 className={styles.title}>{selected.title}</h1>
        </header>

        {!current && (
          <Card className={styles.status}>
            <span className={styles.spinner} />
            <p className={styles.statusTitle}>{t.material.loading}</p>
          </Card>
        )}

        {current?.failure && (
          <Card className={styles.status}>
            <p className={styles.statusTitle}>
              {errorText(current.failure.error)}
            </p>
            <Button variant="soft" onClick={() => setAttempt(a => a + 1)}>
              {t.material.retry}
            </Button>
          </Card>
        )}

        {current && !current.failure && (
          <div className={styles.flow}>
            {swiping && found && (
              <>
                <SwipeCard
                  key={found.phrase}
                  found={found}
                  step={at.index + 1}
                  total={total}
                  onDecide={onDecide}
                  onSkip={onSkip}
                />
                {pending > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setStep({ ...at, panel: true })}
                  >
                    {t.swipe.learnNow(pending)}
                  </Button>
                )}
              </>
            )}

            {!swiping && (
              <>
                {left > 0 ? (
                  <Button
                    variant="ghost"
                    onClick={() => setStep({ ...at, panel: false })}
                  >
                    {t.swipe.keepSwiping(left)}
                  </Button>
                ) : (
                  <p className={styles.statusHint}>
                    {total === 0 ? t.swipe.nothingNew : t.swipe.done}
                  </p>
                )}
                {pending > 0 && (
                  <LearnPanel
                    pending={pending}
                    hasAi={hasAi}
                    onSaved={() => setAttempt(a => a + 1)}
                  />
                )}
              </>
            )}

            {current.expressions.length > 0 && (
              <section>
                <div className={styles.found}>
                  <p className={styles.foundCount}>
                    {t.material.learning(current.expressions.length)}
                  </p>
                  <Button onClick={() => router.push('/practice/')}>
                    <Icon name="practice" size={18} />
                    {t.material.practice}
                  </Button>
                </div>
                <ul className={styles.expressions}>
                  {current.expressions.map(e => (
                    <li key={e.id}>
                      <Card className={styles.expression}>
                        <div className={styles.expressionTop}>
                          <span className={styles.phrase}>{e.phrase}</span>
                          <Badge type={e.type}>
                            {t.expressions.types[e.type]}
                          </Badge>
                        </div>
                        <p className={styles.meaning}>{e.meaning}</p>
                        <p className={styles.example}>{e.example}</p>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </main>
    )
  }

  // ---- List
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t.material.title}</h1>
          <p className={styles.subtitle}>{t.material.subtitle}</p>
        </div>
        <Link href="/add/">
          <Button>
            <Icon name="plus" size={18} />
            {t.material.addText}
          </Button>
        </Link>
      </header>

      {texts && texts.length === 0 && (
        <Card className={styles.status}>
          <Icon name="book" size={40} />
          <p className={styles.statusTitle}>{t.material.empty}</p>
          <p className={styles.statusHint}>{t.material.emptyHint}</p>
        </Card>
      )}

      {texts && texts.length > 0 && (
        <ul className={styles.list}>
          {texts.map(text => (
            <li key={text.id} className={styles.row}>
              <button
                type="button"
                className={styles.rowMain}
                onClick={() => select({ id: text.id, title: text.title })}
                aria-label={t.material.open(text.title)}
              >
                <span className={styles.rowTitle}>{text.title}</span>
                <Icon name="arrowRight" size={18} />
              </button>
              <button
                type="button"
                className={styles.remove}
                onClick={() => remove(text.id)}
                aria-label={t.common.delete}
              >
                <Icon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
