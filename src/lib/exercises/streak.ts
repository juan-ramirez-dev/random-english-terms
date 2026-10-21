const DAY_MS = 86_400_000

// Local calendar day, YYYY-MM-DD: "today" is the user's today, not UTC's.
export function localDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

// Calendar math in UTC so daylight saving never skips or repeats a day.
function shiftDay(day: string, by: number): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d) + by * DAY_MS)
    .toISOString()
    .slice(0, 10)
}

// Consecutive practiced days. Not practicing yet today doesn't break it:
// the run counts back from yesterday until the day is over.
export function computeStreak(days: readonly string[], today: string): number {
  const practiced = new Set(days)
  let cursor = practiced.has(today) ? today : shiftDay(today, -1)
  let streak = 0
  while (practiced.has(cursor)) {
    streak += 1
    cursor = shiftDay(cursor, -1)
  }
  return streak
}
