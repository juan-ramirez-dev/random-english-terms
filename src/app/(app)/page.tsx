'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { deleteText, listTexts } from '@/lib/api-client/library'
import { usePreferences } from '@/lib/i18n/context'
import type { TextSummary } from '@/lib/terms/types'
import { useSelectedText } from './selected-text-provider'
import styles from './library.module.css'

export default function LibraryPage() {
  const { t } = usePreferences()
  const router = useRouter()
  const { select } = useSelectedText()
  const [texts, setTexts] = useState<TextSummary[] | null>(null)

  // setState lives in the .then callback, not synchronously in the effect.
  const load = useCallback(() => listTexts().then(setTexts), [])

  useEffect(() => {
    load()
  }, [load])

  const review = (text: TextSummary) => {
    select({ id: text.id, title: text.title })
    router.push('/study/')
  }

  const remove = async (id: string) => {
    await deleteText(id)
    load()
  }

  return (
    <main className={styles.page}>
      <div className={styles.drag} data-tauri-drag-region />
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t.library.title}</h1>
          <p className={styles.subtitle}>{t.library.subtitle}</p>
        </div>
        <Link href="/add/" className={styles.addLink}>
          <Button>
            <Icon name="plus" size={18} />
            {t.library.addText}
          </Button>
        </Link>
      </header>

      {texts && texts.length === 0 && (
        <div className={styles.empty}>
          <Icon name="book" size={40} />
          <p className={styles.emptyTitle}>{t.library.empty}</p>
          <p className={styles.emptyHint}>{t.library.emptyHint}</p>
          <Link href="/add/">
            <Button variant="soft">{t.library.addText}</Button>
          </Link>
        </div>
      )}

      {texts && texts.length > 0 && (
        <ul className={styles.list}>
          {texts.map(text => (
            <li key={text.id} className={styles.row}>
              <button
                type="button"
                className={styles.rowMain}
                onClick={() => review(text)}
                aria-label={t.library.open(text.title)}
              >
                <span className={styles.rowTitle}>{text.title}</span>
                <span className={styles.rowMeta}>
                  <span>{t.library.terms(text.termCount)}</span>
                  <span
                    className={
                      text.newCount > 0 ? styles.badge : styles.badgeDone
                    }
                  >
                    {text.newCount > 0
                      ? t.library.toReview(text.newCount)
                      : t.library.allReviewed}
                  </span>
                </span>
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
