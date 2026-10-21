'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { loadChoice } from '@/lib/api-client/ai'
import {
  analyzeText,
  getScenario,
  setScenario,
  type Scenario,
} from '@/lib/api-client/exercises'
import { deleteText, listTexts } from '@/lib/api-client/library'
import { usePreferences } from '@/lib/i18n/context'
import type { Expression } from '@/lib/exercises/types'
import type { TextSummary } from '@/lib/terms/types'
import { NoAi } from '../no-ai'
import { useSelectedText } from '../selected-text-provider'
import styles from './material.module.css'

const SCENARIOS: Scenario[] = ['ok', 'analyzing', 'error', 'empty']

interface Result {
  key: string
  expressions: Expression[]
  failure: { error: unknown } | null
}

export default function MaterialPage() {
  const { t, error: errorText } = usePreferences()
  const router = useRouter()
  const { selected, select, clear } = useSelectedText()
  const [texts, setTexts] = useState<TextSummary[] | null>(null)
  const [hasAi, setHasAi] = useState<boolean | null>(null)
  const [scenario, setScenarioState] = useState<Scenario>(getScenario)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)

  // setState lives in the .then callback, not synchronously in the effect.
  const load = useCallback(() => listTexts().then(setTexts), [])

  useEffect(() => {
    load()
    loadChoice().then(choice => setHasAi(choice !== null))
  }, [load])

  const key = selected ? `${selected.id}:${scenario}:${attempt}` : null
  const id = selected?.id

  useEffect(() => {
    if (!id || !key || !hasAi) return
    let cancelled = false
    analyzeText(id).then(
      expressions => {
        if (!cancelled) setResult({ key, expressions, failure: null })
      },
      (e: unknown) => {
        if (!cancelled)
          setResult({ key, expressions: [], failure: { error: e } })
      },
    )
    return () => {
      cancelled = true
    }
  }, [id, key, hasAi])

  const remove = async (textId: string) => {
    await deleteText(textId)
    load()
  }

  const changeScenario = (next: Scenario) => {
    setScenario(next)
    setScenarioState(next)
  }

  // ---- One text open
  if (selected) {
    const analyzing = hasAi && result?.key !== key
    const current = result?.key === key ? result : null
    return (
      <main className={styles.page}>
        <button type="button" className={styles.back} onClick={clear}>
          <Icon name="arrowLeft" size={16} />
          {t.material.all}
        </button>
        <header className={styles.header}>
          <h1 className={styles.title}>{selected.title}</h1>
          <label className={styles.scenario}>
            {t.material.scenario}
            <select
              value={scenario}
              onChange={e => changeScenario(e.target.value as Scenario)}
            >
              {SCENARIOS.map(s => (
                <option key={s} value={s}>
                  {t.material.scenarios[s]}
                </option>
              ))}
            </select>
          </label>
        </header>

        {hasAi === false && <NoAi />}

        {analyzing && (
          <Card className={styles.status}>
            <span className={styles.spinner} />
            <p className={styles.statusTitle}>{t.material.analyzing}</p>
            <p className={styles.statusHint}>{t.material.analyzingHint}</p>
          </Card>
        )}

        {current?.failure && (
          <Card className={styles.status}>
            <p className={styles.statusTitle}>
              {errorText(current.failure.error)}
            </p>
            <Button variant="soft" onClick={() => setAttempt(a => a + 1)}>
              {t.material.retry}
            </Button>
          </Card>
        )}

        {current && !current.failure && (
          <>
            <div className={styles.found}>
              <p className={styles.foundCount}>
                {t.material.found(current.expressions.length)}
              </p>
              <Button onClick={() => router.push('/practice/')}>
                <Icon name="practice" size={18} />
                {t.material.practice}
              </Button>
            </div>
            <ul className={styles.expressions}>
              {current.expressions.map(e => (
                <li key={e.id}>
                  <Card className={styles.expression}>
                    <div className={styles.expressionTop}>
                      <span className={styles.phrase}>{e.phrase}</span>
                      <Badge type={e.type}>{t.expressions.types[e.type]}</Badge>
                    </div>
                    <p className={styles.meaning}>{e.meaning}</p>
                    <p className={styles.example}>{e.example}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    )
  }

  // ---- List
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t.material.title}</h1>
          <p className={styles.subtitle}>{t.material.subtitle}</p>
        </div>
        <Link href="/add/">
          <Button>
            <Icon name="plus" size={18} />
            {t.material.addText}
          </Button>
        </Link>
      </header>

      {texts && texts.length === 0 && (
        <Card className={styles.status}>
          <Icon name="book" size={40} />
          <p className={styles.statusTitle}>{t.material.empty}</p>
          <p className={styles.statusHint}>{t.material.emptyHint}</p>
        </Card>
      )}

      {texts && texts.length > 0 && (
        <ul className={styles.list}>
          {texts.map(text => (
            <li key={text.id} className={styles.row}>
              <button
                type="button"
                className={styles.rowMain}
                onClick={() => select({ id: text.id, title: text.title })}
                aria-label={t.material.open(text.title)}
              >
                <span className={styles.rowTitle}>{text.title}</span>
                <Icon name="arrowRight" size={18} />
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
