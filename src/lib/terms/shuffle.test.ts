import { shuffle } from './shuffle'

describe('shuffle', () => {
  it('is deterministic for a given seed', () => {
    const input = [1, 2, 3, 4, 5]
    expect(shuffle(input, 7)).toEqual(shuffle(input, 7))
  })

  it('keeps the same elements', () => {
    const out = shuffle([1, 2, 3, 4, 5], 99)
    expect([...out].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5])
  })

  it('does not mutate the input', () => {
    const input = [1, 2, 3]
    shuffle(input, 3)
    expect(input).toEqual([1, 2, 3])
  })
})
