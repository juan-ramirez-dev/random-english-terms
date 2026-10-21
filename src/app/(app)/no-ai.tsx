'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { usePreferences } from '@/lib/i18n/context'
import styles from './no-ai.module.css'

// Shown instead of any AI-powered screen while no AI is chosen.
export function NoAi() {
  const { t } = usePreferences()
  return (
    <Card className={styles.box}>
      <span className={styles.icon}>
        <Icon name="practice" size={28} />
      </span>
      <p className={styles.title}>{t.noAi.title}</p>
      <p className={styles.text}>{t.noAi.text}</p>
      <Link href="/settings/">
        <Button>{t.noAi.cta}</Button>
      </Link>
    </Card>
  )
}
