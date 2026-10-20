'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { ProgressRing } from '@/components/ui/progress-ring'
import { decideTerm, getTerms } from '@/lib/api-client/library'
import { usePreferences } from '@/lib/i18n/context'
import { shuffle } from '@/lib/terms/shuffle'
import type { Term } from '@/lib/terms/types'
import { useSelectedText } from '../selected-text-provider'
import styles from './study.module.css'

export default function StudyPage() {
  const { t } = usePreferences()
  const router = useRouter()
  const { selected } = useSelectedText()

  const [queue, setQueue] = useState<Term[]>([])
  const [index, setIndex] = useState(0)
  const [counts, setCounts] = useState({ known: 0, learning: 0 })
  const [ready, setReady] = useState(false)

  // setState lives in the .then callback, not synchronously in the effect.
  const loadQueue = useCallback(
    (id: string) =>
      getTerms(id).then(terms => {
        // Known words drop out; new and still-learning words come up.
        const pending = terms.filter(term => term.status !== 'known')
        setQueue(shuffle(pending, Date.now()))
        setIndex(0)
        setCounts({ known: 0, learning: 0 })
        setReady(true)
      }),
    [],
  )

  useEffect(() => {
    if (selected) loadQueue(selected.id)
  }, [selected, loadQueue])

  const current = queue[index]

  const decide = useCallback(
    (status: 'known' | 'learning') => {
      if (!current) return
      decideTerm(current.id, status).catch(() => undefined)
      setCounts(c => ({
        known: c.known + (status === 'known' ? 1 : 0),
        learning: c.learning + (status === 'learning' ? 1 : 0),
      }))
      setIndex(i => i + 1)
    },
    [current],
  )

  const skip = useCallback(() => {
    if (current) setIndex(i => i + 1)
  }, [current])

  // Keyboard: ← know, → learn, ↑ / Space skip.
  useEffect(() => {
    if (!current) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') decide('known')
      else if (e.key === 'ArrowRight') decide('learning')
      else if (e.key === 'ArrowUp' || e.key === ' ') {
        e.preventDefault()
        skip()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, decide, skip])

  // No text chosen yet.
  if (!selected) {
    return (
      <main className={styles.page}>
        <div className={styles.drag} data-tauri-drag-region />
        <div className={styles.centered}>
          <Icon name="study" size={40} />
          <p className={styles.message}>{t.study.pickFirst}</p>
          <Button variant="soft" onClick={() => router.push('/')}>
            {t.study.goToLibrary}
          </Button>
        </div>
      </main>
    )
  }

  const total = queue.length
  const done = ready && index >= total

  return (
    <main className={styles.page}>
      <div className={styles.drag} data-tauri-drag-region />
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{selected.title}</p>
          <h1 className={styles.heading}>{t.study.title}</h1>
        </div>
        {ready && total > 0 && !done && (
          <ProgressRing value={index} max={total} label={`${index}/${total}`} />
        )}
      </header>

      {ready && total === 0 && (
        <div className={styles.centered}>
          <p className={styles.message}>{t.study.noTerms}</p>
          <Button variant="soft" onClick={() => router.push('/')}>
            {t.study.backToLibrary}
          </Button>
        </div>
      )}

      {ready && total > 0 && !done && current && (
        <section className={styles.stage}>
          <p className={styles.progress}>
            {t.study.progress(index + 1, total)}
          </p>
          <div className={styles.card}>
            <span className={styles.word}>{current.word}</span>
          </div>
          <div className={styles.controls}>
            <button
              type="button"
              className={`${styles.choice} ${styles.known}`}
              onClick={() => decide('known')}
            >
              <Icon name="arrowLeft" size={18} />
              {t.study.known}
            </button>
            <button type="button" className={styles.skip} onClick={skip}>
              {t.study.skip}
            </button>
            <button
              type="button"
              className={`${styles.choice} ${styles.learn}`}
              onClick={() => decide('learning')}
            >
              {t.study.learn}
              <Icon name="arrowRight" size={18} />
            </button>
          </div>
          <p className={styles.hint}>{t.study.hintSkip}</p>
        </section>
      )}

      {done && (
        <div className={styles.centered}>
          <Icon name="star" size={40} />
          <p className={styles.doneTitle}>{t.study.doneTitle}</p>
          <p className={styles.doneSummary}>
            {t.study.doneSummary(counts.known, counts.learning)}
          </p>
          <div className={styles.doneActions}>
            <Button
              variant="soft"
              onClick={() => selected && loadQueue(selected.id)}
            >
              {t.study.reviewAgain}
            </Button>
            <Button onClick={() => router.push('/')}>
              {t.study.backToLibrary}
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}
