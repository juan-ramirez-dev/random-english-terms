'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Expression } from '@/lib/exercises/types'
import { usePreferences } from '@/lib/i18n/context'
import styles from './lesson-card.module.css'

// Read before the first exercise of a new phrase, so nothing is a guess.
export function LessonCard({
  expression,
  onNext,
}: {
  expression: Expression
  onNext: () => void
}) {
  const { t } = usePreferences()
  const { lesson } = expression
  const copy = t.practice.lesson

  return (
    <Card className={styles.card}>
      <p className={styles.kind}>{copy.title}</p>
      <div className={styles.top}>
        <span className={styles.phrase}>{expression.phrase}</span>
        <Badge type={expression.type}>
          {t.expressions.types[expression.type]}
        </Badge>
      </div>
      <p className={styles.meaning}>{expression.meaning}</p>

      {lesson.usage && (
        <section className={styles.section}>
          <h2 className={styles.label}>{copy.usage}</h2>
          <p className={styles.text}>{lesson.usage}</p>
        </section>
      )}

      {lesson.translation && (
        <section className={styles.section}>
          <h2 className={styles.label}>{copy.translation}</h2>
          <p className={styles.text}>{lesson.translation}</p>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.label}>{copy.examples}</h2>
        <ul className={styles.list}>
          {lesson.examples.map(example => (
            <li key={example}>{example}</li>
          ))}
        </ul>
      </section>

      {lesson.dialog.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.label}>{copy.dialog}</h2>
          <div className={styles.dialog}>
            {lesson.dialog.map((line, i) => (
              <p key={i} className={styles.line}>
                {line}
              </p>
            ))}
          </div>
        </section>
      )}

      <Button onClick={onNext}>{copy.start}</Button>
    </Card>
  )
}
