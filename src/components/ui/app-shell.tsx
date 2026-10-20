'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Messages } from '@/lib/i18n/en'
import { usePreferences } from '@/lib/i18n/context'
import styles from './app-shell.module.css'
import { Icon, type IconName } from './icon'
import { Wordmark } from './wordmark'

const NAV: { href: string; label: keyof Messages['nav']; icon: IconName }[] = [
  { href: '/', label: 'library', icon: 'library' },
  { href: '/study/', label: 'study', icon: 'study' },
  { href: '/words/', label: 'words', icon: 'words' },
  { href: '/settings/', label: 'settings', icon: 'settings' },
]

// A route is active for its own path (and the library owns "/").
function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(href)
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { t } = usePreferences()
  return (
    <div className={styles.shell}>
      <aside className={styles.side}>
        {/* Room for the macOS traffic lights; draggable like a title bar. */}
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
              <Icon name={item.icon} size={20} />
              <span>{t.nav[item.label]}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <div className={styles.content}>{children}</div>
    </div>
  )
}
