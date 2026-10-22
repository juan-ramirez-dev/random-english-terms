import { CLAUDE_MAX, claudePrompt } from './claude-prompt'
import type { PendingPhrase } from './types'

const pending = (phrase: string, sentence = ''): PendingPhrase => ({
  phrase,
  type: 'phrasal-verb',
  sentence,
  textId: 't1',
})

describe('claudePrompt', () => {
  it('puts the picked phrases with their sentences in the prompt', () => {
    const prompt = claudePrompt([
      pending('give up', 'We had to give up.'),
      pending('figure out'),
    ])
    expect(prompt).toContain(
      '{"expressions":[{"phrase":"give up","type":"phrasal-verb","sentence":"We had to give up."},{"phrase":"figure out","type":"phrasal-verb","sentence":""}]}',
    )
  })

  it('keeps only the first CLAUDE_MAX phrases', () => {
    const many = Array.from({ length: CLAUDE_MAX + 1 }, (_, i) =>
      pending(`phrase ${i}`),
    )
    const prompt = claudePrompt(many)
    expect(prompt).toContain(`"phrase ${CLAUDE_MAX - 1}"`)
    expect(prompt).not.toContain(`"phrase ${CLAUDE_MAX}"`)
  })
})
