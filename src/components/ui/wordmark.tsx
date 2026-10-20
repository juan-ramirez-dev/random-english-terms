import { ViewTransition } from 'react'
import styles from './wordmark.module.css'

// Keeps the logo still while the page changes. `compact` = symbol only (sidebar).
export function Wordmark({
  compact,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <ViewTransition name="brand">
      <span
        className={[styles.wordmark, className].filter(Boolean).join(' ')}
        aria-label={compact ? 'Lexio' : undefined}
      >
        <svg className={styles.mark} viewBox="0 0 48 48" aria-hidden>
          <rect className={styles.tile} width="48" height="48" rx="13" />
          {/* A big star and a small one over the night tile. */}
          <path
            className={styles.star}
            d="M28 11l2.2 4.8L35.4 17l-3.9 3.5 1 5.3-4.5-2.6-4.5 2.6 1-5.3L16.6 17l5.2-1.2z"
          />
          <circle className={styles.spark} cx="16" cy="31" r="2.4" />
          <circle className={styles.sparkDim} cx="34" cy="33" r="1.6" />
        </svg>
        {!compact && <span className={styles.name}>Lexio</span>}
      </span>
    </ViewTransition>
  )
}
