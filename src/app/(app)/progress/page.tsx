'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { listExpressions } from '@/lib/api-client/exercises'
import { usePreferences } from '@/lib/i18n/context'
import type { Expression, Mastery } from '@/lib/exercises/types'
import styles from './progress.module.css'

const LEVELS: Mastery[] = ['learning', 'new', 'mastered']

export default function ProgressPage() {
  const { t } = usePreferences()
  const [items, setItems] = useState<Expression[] | null>(null)

  useEffect(() => {
    listExpressions().then(setItems)
  }, [])

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.progress.title}</h1>
        <p className={styles.subtitle}>{t.progress.subtitle}</p>
      </header>

      {items && items.length === 0 && (
        <Card className={styles.empty}>
          <p className={styles.emptyTitle}>{t.progress.empty}</p>
          <p>{t.progress.emptyHint}</p>
        </Card>
      )}

      {items &&
        LEVELS.map(level => {
          const group = items.filter(e => e.mastery === level)
          if (group.length === 0) return null
          return (
            <section key={level} className={styles.section}>
              <h2 className={styles.sectionTitle} data-level={level}>
                {t.expressions.mastery[level]}
                <span className={styles.count}>{group.length}</span>
              </h2>
              <ul className={styles.list}>
                {group.map(e => (
                  <li key={e.id}>
                    <Card className={styles.item}>
                      <div className={styles.top}>
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
          )
        })}
    </main>
  )
}
