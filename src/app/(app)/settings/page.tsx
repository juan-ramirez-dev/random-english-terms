'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { deleteAllTexts } from '@/lib/api-client/library'
import { usePreferences } from '@/lib/i18n/context'
import { LANGUAGES } from '@/lib/i18n/locale'
import { useUpdate } from '../update-provider'
import { AiSettings } from './ai-settings'
import styles from './settings.module.css'

const APP_VERSION = '0.9.0'
const DATA_FILE = '~/Library/Application Support/dev.juanramirez.lexio/lexio.db'

export default function SettingsPage() {
  const { t, prefs, setLanguage } = usePreferences()
  const [confirming, setConfirming] = useState(false)
  const { update, checked, isChecking, checkForUpdate } = useUpdate()

  const wipe = async () => {
    await deleteAllTexts()
    setConfirming(false)
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t.settings.title}</h1>
        <p className={styles.subtitle}>{t.settings.subtitle}</p>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t.settings.language}</h2>
        <div className={styles.segmented}>
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              type="button"
              className={
                prefs.language === lang ? styles.segActive : styles.seg
              }
              onClick={() => setLanguage(lang)}
            >
              {t.settings.languages[lang]}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t.settings.ai}</h2>
        <AiSettings />
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t.settings.about}</h2>
        <dl className={styles.facts}>
          <div className={styles.fact}>
            <dt>{t.settings.version}</dt>
            <dd>{APP_VERSION}</dd>
          </div>
          <div className={styles.fact}>
            <dt>{t.settings.dataFile}</dt>
            <dd className={styles.mono}>{DATA_FILE}</dd>
          </div>
        </dl>
        <div className={styles.updateRow}>
          <Button variant="soft" onClick={checkForUpdate} disabled={isChecking}>
            {isChecking ? t.update.checking : t.update.check}
          </Button>
          {!isChecking && checked && (
            <span className={styles.updateStatus}>
              {update ? t.update.available(update.version) : t.update.upToDate}
            </span>
          )}
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>{t.settings.danger}</h2>
        <p className={styles.hint}>{t.settings.deleteAllHint}</p>
        <Button variant="danger" onClick={() => setConfirming(true)}>
          {t.settings.deleteAll}
        </Button>
      </section>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        eyebrow={t.settings.danger}
        title={t.settings.deleteAllConfirm}
      >
        <p className={styles.modalText}>{t.settings.deleteAllMessage}</p>
        <div className={styles.modalActions}>
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            {t.common.cancel}
          </Button>
          <Button variant="danger" onClick={wipe}>
            {t.settings.deleteAllOk}
          </Button>
        </div>
      </Modal>
    </main>
  )
}
