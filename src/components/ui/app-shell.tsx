import { TopBar } from './top-bar'
import styles from './app-shell.module.css'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <TopBar />
      <div className={styles.content}>{children}</div>
    </div>
  )
}
