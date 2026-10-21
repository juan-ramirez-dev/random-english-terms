'use client'

import { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import type { Decision } from '@/lib/exercises/types'
import { usePreferences } from '@/lib/i18n/context'
import type { FoundPhrase } from '@/lib/terms/types'
import styles from './swipe-card.module.css'

// One phrase at a time: ← know, → learn, ↑ / Space skip.
export function SwipeCard({
  found,
  step,
  total,
  onDecide,
  onSkip,
}: {
  found: FoundPhrase
  step: number
  total: number
  onDecide: (decision: Decision) => void
  onSkip: () => void
}) {
  const { t } = usePreferences()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.key === 'ArrowLeft') onDecide('known')
      else if (e.key === 'ArrowRight') onDecide('learn')
      else if (e.key === 'ArrowUp' || e.key === ' ') {
        e.preventDefault()
        onSkip()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDecide, onSkip])

  return (
    <section className={styles.stage}>
      <p className={styles.step}>{t.swipe.step(step, total)}</p>
      <div className={styles.card}>
        <Badge type={found.type}>{t.expressions.types[found.type]}</Badge>
        <span className={styles.phrase}>{found.phrase}</span>
        <p className={styles.sentence}>{found.sentence}</p>
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className={`${styles.choice} ${styles.known}`}
          onClick={() => onDecide('known')}
        >
          <Icon name="arrowLeft" size={18} />
          {t.swipe.known}
        </button>
        <button type="button" className={styles.skip} onClick={onSkip}>
          {t.swipe.skip}
        </button>
        <button
          type="button"
          className={`${styles.choice} ${styles.learn}`}
          onClick={() => onDecide('learn')}
        >
          {t.swipe.learn}
          <Icon name="arrowRight" size={18} />
        </button>
      </div>
      <p className={styles.keys}>{t.swipe.keys}</p>
    </section>
  )
}
