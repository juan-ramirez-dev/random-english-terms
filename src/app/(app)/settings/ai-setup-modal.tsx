'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  addLocalProvider,
  addOnlineProvider,
  downloadModel,
  importModel,
  type LocalModel,
} from '@/lib/api-client/ai'
import {
  ONLINE_IDS,
  ONLINE_PROVIDERS,
  type OnlineProviderId,
} from '@/lib/ai/catalog'
import { usePreferences } from '@/lib/i18n/context'
import { LOCALES } from '@/lib/i18n/locale'
import type { AiConfig } from './use-ai'
import styles from './settings.module.css'

interface AiSetupModalProps {
  open: boolean
  config: AiConfig
  onDone: () => Promise<unknown>
  onClose: () => void
}

function formatSize(bytes: number, language: string) {
  const gb = bytes / 1_000_000_000
  return `${new Intl.NumberFormat(LOCALES[language as 'en' | 'es'], {
    maximumFractionDigits: 1,
  }).format(gb)} GB`
}

export function AiSetupModal({
  open,
  config,
  onDone,
  onClose,
}: AiSetupModalProps) {
  const { t } = usePreferences()
  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow={t.aiSetup.eyebrow}
      title={t.aiSetup.title}
    >
      {/* Mounted fresh on every open. */}
      {open && <Picker config={config} onDone={onDone} onClose={onClose} />}
    </Modal>
  )
}

function Picker({
  config,
  onDone,
  onClose,
}: {
  config: AiConfig
  onDone: () => Promise<unknown>
  onClose: () => void
}) {
  const { t } = usePreferences()
  const copy = t.aiSetup
  const [mode, setMode] = useState<'local' | 'online'>('online')

  const finish = async () => {
    await onDone()
    onClose()
  }

  return (
    <div className={styles.setup}>
      <div
        className={styles.modeSegment}
        role="radiogroup"
        aria-label={copy.aiType}
      >
        {(['online', 'local'] as const).map(m => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            className={mode === m ? styles.modeActive : styles.mode}
            onClick={() => setMode(m)}
          >
            {m === 'local' ? copy.local : copy.online}
          </button>
        ))}
      </div>

      {mode === 'online' ? (
        <OnlineForm onDone={finish} />
      ) : (
        <>
          <p className={styles.note}>
            <strong>{copy.privateTitle}</strong> {copy.privateText}
          </p>
          <ModelPicker
            models={config.models}
            onDone={async id => {
              await addLocalProvider(id)
              await finish()
            }}
          />
        </>
      )}
    </div>
  )
}

function OnlineForm({ onDone }: { onDone: () => Promise<void> }) {
  const { t, error: errorFor } = usePreferences()
  const copy = t.aiSetup
  const [provider, setProvider] = useState<OnlineProviderId>('anthropic')
  const info = ONLINE_PROVIDERS[provider]
  const recommended = (id: OnlineProviderId) =>
    ONLINE_PROVIDERS[id].models.find(m => m.recommended)?.id ?? ''
  const [model, setModel] = useState(() => recommended('anthropic'))
  const [key, setKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, startSaving] = useTransition()

  const pick = (id: OnlineProviderId) => {
    setProvider(id)
    setModel(recommended(id))
    setError(null)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!key.trim() || saving) return
    startSaving(async () => {
      setError(null)
      try {
        await addOnlineProvider(provider, model, key)
        await onDone()
      } catch (err) {
        setError(errorFor(err))
      }
    })
  }

  return (
    <form className={styles.setup} onSubmit={submit}>
      <div className={styles.group}>
        <p className={styles.groupLabel}>{copy.provider}</p>
        <div className={styles.options}>
          {ONLINE_IDS.map(id => (
            <button
              key={id}
              type="button"
              className={provider === id ? styles.optionActive : styles.option}
              onClick={() => pick(id)}
            >
              {ONLINE_PROVIDERS[id].name}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <p className={styles.groupLabel}>{copy.model}</p>
        <div className={styles.options}>
          {info.models.map(m => (
            <button
              key={m.id}
              type="button"
              className={model === m.id ? styles.optionActive : styles.option}
              onClick={() => setModel(m.id)}
            >
              {m.name} {m.recommended && <small>{t.common.recommended}</small>}
            </button>
          ))}
        </div>
      </div>

      <label className={styles.field}>
        <span className={styles.fieldLabel}>{copy.keyLabel}</span>
        <input
          className={styles.input}
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder={copy.keyPlaceholder}
          value={key}
          onChange={e => setKey(e.target.value)}
        />
        <span className={styles.fieldHint}>{copy.keyWhere(info.keyUrl)}</span>
      </label>

      <div className={styles.note}>
        <strong>{copy.keySafe}</strong>
        <ul>
          <li>{copy.keychain}</li>
          <li>{copy.onlyFor(info.name)}</li>
        </ul>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <Button type="submit" block disabled={!key.trim() || saving}>
        {saving ? copy.testing : copy.testAndSave}
      </Button>
    </form>
  )
}

// If a model is already on disk it's used without downloading anything.
function ModelPicker({
  models,
  onDone,
}: {
  models: LocalModel[]
  onDone: (id: string) => Promise<void>
}) {
  const { t, prefs, error: errorFor } = usePreferences()
  const copy = t.aiSetup
  const installed = models.find(m => m.installed)
  const [selected, setSelected] = useState(
    () => installed?.id ?? models.find(m => m.recommended)?.id ?? '',
  )
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, startBusy] = useTransition()
  const model = models.find(m => m.id === selected)
  // Already on disk here, or in another app's folder we can link to.
  const canReuse = Boolean(model && !model.installed && model.importable)

  const run = () =>
    startBusy(async () => {
      setError(null)
      try {
        if (model && !model.installed) {
          if (model.importable) {
            await importModel(selected)
          } else {
            setProgress(0)
            await downloadModel(selected, setProgress)
          }
        }
        await onDone(selected)
      } catch (err) {
        setError(errorFor(err))
      } finally {
        setProgress(null)
      }
    })

  return (
    <div className={styles.group}>
      <div className={styles.options}>
        {models.map(m => (
          <button
            key={m.id}
            type="button"
            className={selected === m.id ? styles.optionActive : styles.option}
            disabled={busy}
            onClick={() => setSelected(m.id)}
          >
            {m.name}{' '}
            <small>
              {m.installed
                ? copy.downloaded
                : m.importable
                  ? copy.available
                  : formatSize(m.size, prefs.language)}
              {m.recommended && ` · ${t.common.recommended}`}
            </small>
          </button>
        ))}
      </div>
      {progress !== null && (
        <div className={styles.progress}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <span className={styles.progressPct}>
            {Math.round(progress * 100)}%
          </span>
        </div>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <Button type="button" block disabled={!model || busy} onClick={run}>
        {busy
          ? progress !== null
            ? copy.downloading
            : canReuse
              ? copy.importing
              : t.common.saving
          : model?.installed
            ? copy.useThis
            : canReuse
              ? copy.reuse
              : copy.downloadAndUse}
      </Button>
      {installed && model && model.id !== installed.id && (
        <p className={styles.fieldHint}>{copy.replaces(installed.name)}</p>
      )}
    </div>
  )
}
