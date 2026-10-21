'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getStreak } from '@/lib/api-client/exercises'
import { usePreferences } from '@/lib/i18n/context'
import type { Messages } from '@/lib/i18n/en'
import { Icon, type IconName } from './icon'
import styles from './top-bar.module.css'
import { Wordmark } from './wordmark'

const NAV: { href: string; label: keyof Messages['nav']; icon: IconName }[] = [
  { href: '/', label: 'home', icon: 'home' },
  { href: '/practice/', label: 'practice', icon: 'practice' },
  { href: '/material/', label: 'material', icon: 'material' },
  { href: '/progress/', label: 'progress', icon: 'progress' },
]

// Home owns "/" only; the rest own their own path.
function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href.replace(/\/$/, ''))
}

export function TopBar() {
  const pathname = usePathname()
  const { t } = usePreferences()
  const [streak, setStreak] = useState(0)

  // Re-read on every route change: a finished session raises it.
  useEffect(() => {
    getStreak().then(setStreak)
  }, [pathname])

  return (
    <header className={styles.bar}>
      {/* Clears the macOS traffic lights; the bar is also the drag handle. */}
      <div className={styles.drag} data-tauri-drag-region />
      <Wordmark className={styles.brand} />
      <nav className={styles.nav}>
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={styles.link}
            aria-current={isActive(pathname, item.href) ? 'page' : undefined}
          >
            <Icon name={item.icon} size={18} />
            <span>{t.nav[item.label]}</span>
          </Link>
        ))}
      </nav>
      <div className={styles.right}>
        <span className={styles.streak} title={t.home.streak(streak)}>
          <Icon name="flame" size={18} />
          {streak}
        </span>
        <Link
          href="/settings/"
          className={styles.iconLink}
          aria-label={t.nav.settings}
          aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
        >
          <Icon name="settings" size={20} />
        </Link>
      </div>
    </header>
  )
}
