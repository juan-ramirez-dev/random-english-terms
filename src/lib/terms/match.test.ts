import { findPhrases } from './match'

const phrases = (text: string) => findPhrases(text).map(f => f.phrase)

describe('findPhrases', () => {
  it('recognizes conjugated phrasal verbs', () => {
    expect(phrases('She gave up. They are giving up.')).toEqual(['give up'])
  })

  it('recognizes split phrasal verbs', () => {
    expect(phrases('Please turn it off.')).toContain('turn off')
  })

  it('ignores a particle more than 3 words away', () => {
    expect(phrases('Turn the big old red lamp off.')).not.toContain('turn off')
  })

  it('keeps only the longest phrase at a position', () => {
    const found = phrases('We ran out of time.')
    expect(found).toContain('run out of')
    expect(found).not.toContain('run out')
  })
})
