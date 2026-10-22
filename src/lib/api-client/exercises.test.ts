import { getDb } from '@/lib/local-db/db'
import { swipeQueue } from './exercises'

jest.mock('@/lib/local-db/db', () => ({ getDb: jest.fn(), now: jest.fn() }))

const text = {
  id: 't1',
  title: 'Standup',
  content: 'We had to give up. Then we figured out the bug.',
  word_count: 11,
  created_at: '2026-10-21',
}

// "give up" was already swiped in another text.
beforeEach(() => {
  const select = jest
    .fn()
    .mockImplementation((sql: string) =>
      Promise.resolve(
        sql.includes('phrase_decisions') ? [{ normalized: 'give up' }] : [text],
      ),
    )
  jest.mocked(getDb).mockResolvedValue({ select, execute: jest.fn() })
})

describe('swipeQueue', () => {
  it('puts the phrases found in the text first', async () => {
    const [first] = await swipeQueue('t1')
    expect(first).toEqual({
      phrase: 'figure out',
      type: 'phrasal-verb',
      sentence: 'Then we figured out the bug.',
    })
  })

  it('fills the queue up to 50 with built-in phrases without a sentence', async () => {
    const queue = await swipeQueue('t1')
    expect(queue).toHaveLength(50)
    expect(queue.slice(1).every(f => f.sentence === '')).toBe(true)
  })

  it('leaves out phrases already decided in another text', async () => {
    const queue = await swipeQueue('t1')
    expect(queue.map(f => f.phrase)).not.toContain('give up')
  })
})
