'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { getStreak, listExpressions } from '@/lib/api-client/exercises'
import { listTexts } from '@/lib/api-client/library'
import { usePreferences } from '@/lib/i18n/context'
import type { Expression, Mastery } from '@/lib/exercises/types'
import type { TextSummary } from '@/lib/terms/types'
import { useSelectedText } from './selected-text-provider'
import styles from './home.module.css'

const LEVELS: Mastery[] = ['new', 'learning', 'mastered']
const RECENT = 3

export default function HomePage() {
  const { t } = usePreferences()
  const router = useRouter()
  const { clear, select } = useSelectedText()
  const [texts, setTexts] = useState<TextSummary[] | null>(null)
  const [expressions, setExpressions] = useState<Expression[] | null>(null)
  const [streak, setStreak] = useState(0)

  // setState lives in the .then callbacks, not synchronously in the effect.
  useEffect(() => {
    listTexts().then(setTexts)
    listExpressions().then(setExpressions)
    Promise.resolve(getStreak()).then(setStreak)
  }, [])

  const toLearn = expressions?.filter(e => e.mastery !== 'mastered').length ?? 0
  const count = (level: Mastery) =>
    expressions?.filter(e => e.mastery === level).length ?? 0

  const practiceAll = () => {
    clear()
    router.push('/practice/')
  }

  const openText = (text: TextSummary) => {
    select({ id: text.id, title: text.title })
    router.push('/material/')
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.streak}>
          <Icon name="flame" size={18} />
          {t.home.streak(streak)}
        </span>
        <h1 className={styles.greeting}>{t.home.greeting}</h1>
        <p className={styles.toLearn}>
          {toLearn > 0 ? t.home.toLearn(toLearn) : t.home.allDone}
        </p>
        <button type="button" className={styles.cta} onClick={practiceAll}>
          <Icon name="practice" size={22} />
          {t.home.cta}
        </button>
      </section>

      <div className={styles.columns}>
        <section>
          <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t.home.recent}</h2>
            <Link href="/material/" className={styles.seeAll}>
              {t.home.seeAll}
            </Link>
          </header>
          {texts && texts.length === 0 && (
            <Card className={styles.empty}>
              <p>{t.home.recentEmpty}</p>
              <Link href="/add/">
                <Button variant="soft">
                  <Icon name="plus" size={18} />
                  {t.home.addText}
                </Button>
              </Link>
            </Card>
          )}
          {texts && texts.length > 0 && (
            <ul className={styles.recent}>
              {texts.slice(0, RECENT).map(text => (
                <li key={text.id}>
                  <button
                    type="button"
                    className={styles.recentRow}
                    onClick={() => openText(text)}
                  >
                    <span className={styles.recentTitle}>{text.title}</span>
                    <Icon name="arrowRight" size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t.home.progress}</h2>
            <Link href="/progress/" className={styles.seeAll}>
              {t.home.seeAll}
            </Link>
          </header>
          <Card className={styles.stats}>
            {LEVELS.map(level => (
              <div key={level} className={styles.stat} data-level={level}>
                <span className={styles.statValue}>{count(level)}</span>
                <span className={styles.statLabel}>
                  {t.expressions.mastery[level]}
                </span>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </main>
  )
}
