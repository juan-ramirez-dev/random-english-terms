'use client'

import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { addText } from '@/lib/api-client/library'
import { usePreferences } from '@/lib/i18n/context'
import styles from './add.module.css'

const baseName = (path: string) =>
  path
    .split(/[\\/]/)
    .pop()
    ?.replace(/\.[^.]+$/, '') ?? ''

export default function AddPage() {
  const { t, error } = usePreferences()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const importFile = async () => {
    setMessage(null)
    try {
      const path = await open({
        multiple: false,
        filters: [{ name: 'Text', extensions: ['txt', 'md'] }],
      })
      if (typeof path !== 'string') return
      setContent(await readTextFile(path))
      if (!title.trim()) setTitle(baseName(path))
    } catch {
      setMessage(t.errors.fileReadFailed)
    }
  }

  const save = async () => {
    setMessage(null)
    setSaving(true)
    try {
      await addText({ title, content })
      router.push('/')
    } catch (e) {
      setMessage(error(e))
      setSaving(false)
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.drag} data-tauri-drag-region />
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t.add.title}</h1>
          <p className={styles.subtitle}>{t.add.subtitle}</p>
        </div>
        <Button variant="soft" onClick={importFile}>
          <Icon name="book" size={16} />
          {t.add.import}
        </Button>
      </header>

      <label className={styles.label} htmlFor="title">
        {t.add.titleLabel}
      </label>
      <input
        id="title"
        className={styles.input}
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder={t.add.titlePlaceholder}
      />

      <label className={styles.label} htmlFor="content">
        {t.add.textLabel}
      </label>
      <textarea
        id="content"
        className={styles.textarea}
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={t.add.textPlaceholder}
        rows={12}
      />

      {message && <p className={styles.error}>{message}</p>}

      <div className={styles.actions}>
        <Button variant="ghost" onClick={() => router.push('/')}>
          {t.common.cancel}
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? t.add.saving : t.add.save}
        </Button>
      </div>
    </main>
  )
}
