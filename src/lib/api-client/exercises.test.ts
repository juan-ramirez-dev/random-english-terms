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

describe('swipeQueue', () => {
  it('leaves out phrases already decided in another text', async () => {
    const select = jest
      .fn()
      .mockImplementation((sql: string) =>
        Promise.resolve(
          sql.includes('phrase_decisions')
            ? [{ normalized: 'give up' }]
            : [text],
        ),
      )
    jest.mocked(getDb).mockResolvedValue({ select, execute: jest.fn() })

    const queue = await swipeQueue('t1')

    expect(queue.map(f => f.phrase)).toEqual(['figure out'])
  })
})
