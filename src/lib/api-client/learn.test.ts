import { invoke } from '@tauri-apps/api/core'
import { getDb } from '@/lib/local-db/db'
import { startLearning } from './learn'

jest.mock('@/lib/local-db/db', () => ({ getDb: jest.fn(), now: jest.fn() }))
jest.mock('@tauri-apps/api/core', () => ({ invoke: jest.fn() }))

const pendingRow = (phrase: string) => ({
  phrase,
  type: 'phrasal-verb',
  sentence: '',
  text_id: 't1',
})

// A usable answer for one phrase: a lesson and one fill-gap exercise.
const answer = (phrase: string) => ({
  expressions: [
    {
      phrase,
      meaning: `meaning of ${phrase}`,
      usage: 'In meetings.',
      translation: '',
      examples: [`We ${phrase} now.`, `They ${phrase} later.`],
      dialog: [],
      exercises: [
        {
          kind: 'fill-gap',
          sentence: 'We ___ every day.',
          options: [],
          answer: phrase,
        },
      ],
    },
  ],
})

const askedPhrase = (args: unknown) =>
  (args as { task: { items: { phrase: string }[] } }).task.items[0].phrase

const execute = jest.fn()

beforeEach(() => {
  const select = jest
    .fn()
    .mockImplementation((sql: string) =>
      Promise.resolve(
        sql.includes('ai_choice')
          ? [{ provider: 'anthropic', model: 'claude-haiku-5-5' }]
          : ['give up', 'figure out', 'look into'].map(pendingRow),
      ),
    )
  execute.mockResolvedValue({ rowsAffected: 1 })
  jest.mocked(getDb).mockResolvedValue({ select, execute })
})

describe('startLearning', () => {
  it('reports each phrase as it is saved, in order', async () => {
    jest
      .mocked(invoke)
      .mockImplementation((_cmd, args) =>
        Promise.resolve(answer(askedPhrase(args))),
      )
    const run = await startLearning()
    expect(run.ready.map(e => e.phrase)).toEqual([
      'give up',
      'figure out',
      'look into',
    ])
    expect(run.running).toBe(false)
  })

  it('skips a phrase with an unusable answer and saves the next ones', async () => {
    jest
      .mocked(invoke)
      .mockImplementation((_cmd, args) =>
        Promise.resolve(
          askedPhrase(args) === 'figure out' ? {} : answer(askedPhrase(args)),
        ),
      )
    const run = await startLearning()
    expect(run.failed).toEqual(['figure out'])
    expect(run.ready.map(e => e.phrase)).toEqual(['give up', 'look into'])
  })

  it('stops on a non-AI error and keeps the phrases already saved', async () => {
    jest
      .mocked(invoke)
      .mockImplementation((_cmd, args) =>
        askedPhrase(args) === 'figure out'
          ? Promise.reject({ code: 'offline', provider: 'Anthropic' })
          : Promise.resolve(answer(askedPhrase(args))),
      )
    const run = await startLearning()
    expect(run.ready.map(e => e.phrase)).toEqual(['give up'])
    expect(run.failure).not.toBeNull()
  })

  it('returns the running run instead of starting a second one', async () => {
    jest
      .mocked(invoke)
      .mockImplementation((_cmd, args) =>
        Promise.resolve(answer(askedPhrase(args))),
      )
    const first = startLearning()
    const second = startLearning()
    expect(second).toBe(first)
    await first
    expect(invoke).toHaveBeenCalledTimes(3)
  })
})
