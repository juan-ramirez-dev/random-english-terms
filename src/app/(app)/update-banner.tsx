'use client'

import { Button } from '@/components/ui/button'
import { usePreferences } from '@/lib/i18n/context'
import { useUpdate } from './update-provider'
import styles from './update-banner.module.css'

export function UpdateBanner() {
  const { t } = usePreferences()
  const copy = t.update
  const { update, dismissed, isInstalling, failed, install, dismiss } =
    useUpdate()

  if (!update || dismissed) return null

  return (
    <aside className={styles.banner} role="status">
      <p className={styles.text}>
        {failed ? copy.failed : copy.available(update.version)}
      </p>
      <div className={styles.actions}>
        <Button type="button" disabled={isInstalling} onClick={install}>
          {isInstalling ? copy.updating : copy.update}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isInstalling}
          onClick={dismiss}
        >
          {t.common.notNow}
        </Button>
      </div>
    </aside>
  )
}
