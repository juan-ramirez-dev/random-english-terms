'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  CLAUDE_MAX,
  claudePrompt,
  learnWithAi,
  saveFromJson,
} from '@/lib/api-client/exercises'
import { ApiClientError } from '@/lib/api-client/http'
import { usePreferences } from '@/lib/i18n/context'
import styles from './learn-panel.module.css'

type Busy = 'ai' | 'copy' | 'save' | null

// Turns the phrases swiped right into expressions with exercises: the chosen AI, or Claude by hand.
export function LearnPanel({
  pending,
  hasAi,
  onSaved,
}: {
  pending: number
  hasAi: boolean
  onSaved: () => void
}) {
  const { t, error: errorText } = usePreferences()
  const [busy, setBusy] = useState<Busy>(null)
  const [copied, setCopied] = useState(false)
  const [pasted, setPasted] = useState('')
  const [saved, setSaved] = useState<number | null>(null)
  const [failure, setFailure] = useState<{ error: unknown } | null>(null)

  const run = async (kind: Busy, job: () => Promise<void>) => {
    setBusy(kind)
    setFailure(null)
    setSaved(null)
    try {
      await job()
    } catch (error) {
      setFailure({ error })
    } finally {
      setBusy(null)
    }
  }

  const generate = () =>
    run('ai', async () => {
      try {
        setSaved(await learnWithAi())
      } finally {
        // Batches saved before a failure still count.
        onSaved()
      }
    })

  const copy = () =>
    run('copy', async () => {
      const prompt = await claudePrompt()
      try {
        await navigator.clipboard.writeText(prompt)
      } catch {
        throw new ApiClientError(500, 'copyFailed')
      }
      setCopied(true)
    })

  const save = () =>
    run('save', async () => {
      setSaved(await saveFromJson(pasted))
      setPasted('')
      setCopied(false)
      onSaved()
    })

  return (
    <Card className={styles.panel}>
      <div>
        <h2 className={styles.title}>{t.learn.title(pending)}</h2>
        <p className={styles.hint}>{t.learn.hint}</p>
      </div>

      {hasAi && (
        <Button onClick={generate} disabled={busy !== null || pending === 0}>
          {busy === 'ai' ? t.learn.generating : t.learn.withAi}
        </Button>
      )}

      <div className={styles.claude}>
        <p className={styles.label}>{t.learn.orClaude}</p>
        <p className={styles.hint}>
          {t.learn.claudeHint}
          {pending > CLAUDE_MAX && ` ${t.learn.firstOnly(CLAUDE_MAX)}`}
        </p>
        <Button
          variant="soft"
          onClick={copy}
          disabled={busy !== null || pending === 0}
        >
          {copied ? t.learn.copied : t.learn.copy}
        </Button>
        <textarea
          className={styles.textarea}
          rows={5}
          value={pasted}
          onChange={e => setPasted(e.target.value)}
          placeholder={t.learn.pastePlaceholder}
        />
        <Button onClick={save} disabled={busy !== null || !pasted.trim()}>
          {t.learn.save}
        </Button>
      </div>

      {failure && <p className={styles.error}>{errorText(failure.error)}</p>}
      {saved !== null && <p className={styles.saved}>{t.learn.saved(saved)}</p>}
    </Card>
  )
}
