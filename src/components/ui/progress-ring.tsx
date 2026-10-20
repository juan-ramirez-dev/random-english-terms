import styles from './progress-ring.module.css'

// A thin linear progress indicator. `value` and `max` are counts; renders value/max beside it.
export function ProgressRing({
  value,
  max,
  label,
}: {
  value: number
  max: number
  label: string
}) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0
  return (
    <div
      className={styles.ring}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <span className={styles.label}>{label}</span>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  )
}
