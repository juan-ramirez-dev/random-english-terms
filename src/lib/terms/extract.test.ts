import { countWords, extractTerms } from './extract'

describe('extractTerms', () => {
  it('drops stopwords', () => {
    const terms = extractTerms('the quick brown fox')
    expect(terms.map(t => t.normalized)).toEqual(['quick', 'brown', 'fox'])
  })

  it('dedupes case-insensitively, keeping the first-seen form', () => {
    const terms = extractTerms('Budget budget BUDGET')
    expect(terms).toEqual([{ word: 'Budget', normalized: 'budget' }])
  })

  it('keeps inner apostrophes and hyphens as one word', () => {
    const terms = extractTerms("it's a well-known fact")
    expect(terms.map(t => t.normalized)).toEqual(["it's", 'well-known', 'fact'])
  })

  it('drops words shorter than 3 letters and pure numbers', () => {
    const terms = extractTerms('go to 42 the office in 2026')
    expect(terms.map(t => t.normalized)).toEqual(['office'])
  })
})

describe('countWords', () => {
  it('counts every word, including stopwords', () => {
    expect(countWords('the quick brown fox')).toBe(4)
  })
})
