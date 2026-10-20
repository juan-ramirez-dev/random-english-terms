'use client'

import { useEffect, useRef } from 'react'
import { usePreferences } from '@/lib/i18n/context'
import { Icon } from './icon'
import styles from './modal.module.css'

interface ModalProps {
  open: boolean
  onClose: () => void
  eyebrow?: string
  title: string
  children: React.ReactNode
}

// Native <dialog>: focus trap, Esc and an inert background with no library.
export function Modal({ open, onClose, eyebrow, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const { t } = usePreferences()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      onClose={onClose}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {open && (
        <div className={styles.inner}>
          <header className={styles.header}>
            <div>
              {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
              <h2 className={styles.title}>{title}</h2>
            </div>
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label={t.common.close}
            >
              <Icon name="close" size={18} />
            </button>
          </header>
          <div className={styles.body}>{children}</div>
        </div>
      )}
    </dialog>
  )
}
