'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { removeChoice } from '@/lib/api-client/ai'
import { modelName, providerName, type AiChoice } from '@/lib/ai/catalog'
import { usePreferences } from '@/lib/i18n/context'
import { AiSetupModal } from './ai-setup-modal'
import { useAi } from './use-ai'
import styles from './settings.module.css'

// Content of the "AI" section in Settings.
export function AiSettings() {
  const { config, refresh } = useAi()
  const { t, error: errorFor } = usePreferences()
  const copy = t.ai
  const [setup, setSetup] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, startBusy] = useTransition()
  if (!config) return null

  const { choice } = config
  // For the local model, show the catalog name, not the id.
  const label = (c: AiChoice) =>
    c.provider === 'local'
      ? (config.models.find(m => m.id === c.model)?.name ?? c.model)
      : modelName(c)

  const remove = () =>
    startBusy(async () => {
      setError(null)
      try {
        if (choice) await removeChoice(choice)
        await refresh()
      } catch (err) {
        setError(errorFor(err))
      }
    })

  return (
    <>
      <p className={styles.hint}>{copy.hint}</p>

      {choice ? (
        <div className={styles.current}>
          <span className={styles.currentName}>
            {providerName(choice.provider, copy.localModel)}
            <small>{label(choice)}</small>
          </span>
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={remove}
          >
            {t.common.remove}
          </Button>
        </div>
      ) : (
        <p className={styles.hint}>{copy.none}</p>
      )}

      <div className={styles.setupActions}>
        <Button type="button" disabled={busy} onClick={() => setSetup(true)}>
          {choice ? copy.change : copy.setUp}
        </Button>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {setup && (
        <AiSetupModal
          open
          config={config}
          onDone={refresh}
          onClose={() => setSetup(false)}
        />
      )}
    </>
  )
}
