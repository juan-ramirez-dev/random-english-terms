import type { ExpressionType } from '@/lib/exercises/types'
import styles from './badge.module.css'

const CLASS: Record<ExpressionType, string> = {
  'phrasal-verb': styles.phrasal,
  idiom: styles.idiom,
  collocation: styles.collocation,
  expression: styles.expression,
}

// Chip that names the kind of expression, one color per kind.
export function Badge({
  type,
  children,
}: {
  type: ExpressionType
  children: React.ReactNode
}) {
  return <span className={`${styles.badge} ${CLASS[type]}`}>{children}</span>
}
