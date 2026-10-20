import styles from './progress-ring.module.css'

// A circular progress meter. `value` and `max` are counts; renders value/max inside.
export function ProgressRing({
  value,
  max,
  label,
}: {
  value: number
  max: number
  label: string
}) {
  const r = 26
  const circumference = 2 * Math.PI * r
  const ratio = max > 0 ? Math.min(value / max, 1) : 0
  return (
    <div
      className={styles.ring}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <svg viewBox="0 0 64 64" className={styles.svg} aria-hidden>
        <circle className={styles.track} cx="32" cy="32" r={r} />
        <circle
          className={styles.value}
          cx="32"
          cy="32"
          r={r}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
        />
      </svg>
      <span className={styles.label}>{label}</span>
    </div>
  )
}
