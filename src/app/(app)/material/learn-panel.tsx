'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { pendingToLearn } from '@/lib/api-client/exercises'
import { ApiClientError } from '@/lib/api-client/http'
import {
  getRun,
  saveFromJson,
  startLearning,
  subscribe,
  type LearnRun,
} from '@/lib/api-client/learn'
import { CLAUDE_MAX, claudePrompt } from '@/lib/exercises/claude-prompt'
import type { PendingPhrase } from '@/lib/exercises/types'
import { usePreferences } from '@/lib/i18n/context'
import styles from './learn-panel.module.css'

type Busy = 'copy' | 'save' | null

const noRun = () => null

// One row per phrase of the run: what the AI already wrote, and what's still coming.
function RunList({ run }: { run: LearnRun }) {
  const { t } = usePreferences()
  const ready = new Map(run.ready.map(e => [e.phrase, e]))
  const failed = new Set(run.failed)
  return (
    <ul className={styles.rows}>
      {run.phrases.map(({ phrase }) => {
        const expression = ready.get(phrase)
        return (
          <li key={phrase} className={styles.row}>
            <span className={styles.mark}>
              {expression && <Icon name="check" size={16} />}
              {!expression && !failed.has(phrase) && run.running && (
                <span className={styles.spinner} />
              )}
            </span>
            <div>
              <p className={styles.phrase}>{phrase}</p>
              {expression && (
                <p className={styles.meaning}>{expression.meaning}</p>
              )}
              {failed.has(phrase) && (
                <p className={styles.error}>{t.learn.failedOne}</p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

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
  const learning = useSyncExternalStore(subscribe, getRun, noRun)
  const [phrases, setPhrases] = useState<PendingPhrase[] | null>(null)
  const [busy, setBusy] = useState<Busy>(null)
  const [copied, setCopied] = useState(false)
  const [pasted, setPasted] = useState('')
  const [saved, setSaved] = useState<number | null>(null)
  const [failure, setFailure] = useState<{ error: unknown } | null>(null)

  // Loaded ahead so the copy happens inside the click.
  useEffect(() => {
    pendingToLearn().then(setPhrases, (error: unknown) => setFailure({ error }))
  }, [])

  const running = learning?.running ?? false

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

  // Errors land in the run itself, so nothing to catch here.
  const generate = () => {
    setFailure(null)
    setSaved(null)
    startLearning()
  }

  const copy = () =>
    run('copy', async () => {
      if (!phrases) return
      try {
        await navigator.clipboard.writeText(claudePrompt(phrases))
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

  const done = learning ? learning.ready.length + learning.failed.length : 0

  return (
    <Card className={styles.panel}>
      <div>
        <h2 className={styles.title}>{t.learn.title(pending)}</h2>
        <p className={styles.hint}>{t.learn.hint}</p>
      </div>

      {hasAi && (
        <Button
          onClick={generate}
          disabled={running || busy !== null || pending === 0}
        >
          {running ? t.learn.generating : t.learn.withAi}
        </Button>
      )}

      {learning && learning.phrases.length > 0 && (
        <div className={styles.run}>
          <p className={styles.label}>
            {t.learn.progress(done, learning.phrases.length)}
          </p>
          <RunList run={learning} />
        </div>
      )}
      {learning?.failure && (
        <p className={styles.error}>{errorText(learning.failure.error)}</p>
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
          disabled={busy !== null || !phrases || phrases.length === 0}
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
        <Button
          onClick={save}
          disabled={running || busy !== null || !pasted.trim()}
        >
          {t.learn.save}
        </Button>
      </div>

      {failure && <p className={styles.error}>{errorText(failure.error)}</p>}
      {saved !== null && <p className={styles.saved}>{t.learn.saved(saved)}</p>}
    </Card>
  )
}
