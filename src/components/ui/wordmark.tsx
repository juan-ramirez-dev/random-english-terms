import { ViewTransition } from 'react'
import styles from './wordmark.module.css'

// Keeps the logo still while the page changes.
export function Wordmark({ className }: { className?: string }) {
  return (
    <ViewTransition name="brand">
      <span className={[styles.wordmark, className].filter(Boolean).join(' ')}>
        Lexio
      </span>
    </ViewTransition>
  )
}
