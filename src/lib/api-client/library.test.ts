import { getDb } from '@/lib/local-db/db'
import { addText, TEXT_MAX } from './library'

jest.mock('@/lib/local-db/db', () => ({ getDb: jest.fn(), now: jest.fn() }))

describe('addText', () => {
  it('rejects content above the limit with textTooLong', async () => {
    await expect(
      addText({ title: 'Long', content: 'word '.repeat(TEXT_MAX) }),
    ).rejects.toMatchObject({ code: 'textTooLong', params: { max: TEXT_MAX } })
    expect(getDb).not.toHaveBeenCalled()
  })
})
