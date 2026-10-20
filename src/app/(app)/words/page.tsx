'use client'

import { useEffect, useState } from 'react'
import { listWords } from '@/lib/api-client/library'
import { usePreferences } from '@/lib/i18n/context'
import type { TermStatus, TermWithText } from '@/lib/terms/types'
import styles from './words.module.css'

type Tab = Extract<TermStatus, 'learning' | 'known'>

export default function WordsPage() {
  const { t } = usePreferences()
  const [tab, setTab] = useState<Tab>('learning')
  const [items, setItems] = useState<TermWithText[] | null>(null)

  useEffect(() => {
    let cancelled = false
    listWords(tab).then(rows => {
      if (!cancelled) setItems(rows)
    })
    return () => {
      cancelled = true
    }
  }, [tab])

  const empty = tab === 'learning' ? t.words.learningEmpty : t.words.knownEmpty

  return (
    <main className={styles.page}>
      <div className={styles.drag} data-tauri-drag-region />
      <header className={styles.header}>
        <h1 className={styles.title}>{t.words.title}</h1>
        <p className={styles.subtitle}>{t.words.subtitle}</p>
      </header>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'learning'}
          className={tab === 'learning' ? styles.tabActive : styles.tab}
          onClick={() => setTab('learning')}
        >
          {t.words.learning}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'known'}
          className={tab === 'known' ? styles.tabActive : styles.tab}
          onClick={() => setTab('known')}
        >
          {t.words.known}
        </button>
      </div>

      {items && items.length === 0 && <p className={styles.empty}>{empty}</p>}

      {items && items.length > 0 && (
        <ul className={styles.list}>
          {items.map(item => (
            <li key={item.id} className={styles.row}>
              <span className={styles.word}>{item.word}</span>
              <span className={styles.from}>
                {t.words.from(item.textTitle)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
