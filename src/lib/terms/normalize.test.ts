import { normalize } from './normalize'

describe('normalize', () => {
  it('lowercases', () => {
    expect(normalize('Budget')).toBe('budget')
  })

  it('unifies curly and straight apostrophes', () => {
    expect(normalize('don’t')).toBe("don't")
  })

  it('strips surrounding quotes and hyphens', () => {
    expect(normalize("'word-")).toBe('word')
  })
})
