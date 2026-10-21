import { computeStreak } from './streak'

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(
      computeStreak(['2026-03-08', '2026-03-09', '2026-03-10'], '2026-03-10'),
    ).toBe(3)
  })

  it('stops at a skipped day', () => {
    expect(
      computeStreak(['2026-03-07', '2026-03-09', '2026-03-10'], '2026-03-10'),
    ).toBe(2)
  })

  it('keeps the streak alive when today has no practice yet', () => {
    expect(computeStreak(['2026-03-08', '2026-03-09'], '2026-03-10')).toBe(2)
  })

  it('is zero when yesterday was skipped and today has no practice', () => {
    expect(computeStreak(['2026-03-07', '2026-03-08'], '2026-03-10')).toBe(0)
  })

  it('counts across a month boundary', () => {
    expect(computeStreak(['2026-02-28', '2026-03-01'], '2026-03-01')).toBe(2)
  })
})
