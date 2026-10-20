// Deterministic Fisher-Yates: the same seed gives the same order within a session.
export function shuffle<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice()
  let s = seed >>> 0 || 1
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
