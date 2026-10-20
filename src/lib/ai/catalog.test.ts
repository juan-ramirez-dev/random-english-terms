import { modelName, providerName } from './catalog'

describe('modelName', () => {
  it('returns the catalog name for a known online model', () => {
    expect(
      modelName({ provider: 'anthropic', model: 'claude-haiku-5-5' }),
    ).toBe('Claude Haiku 5.5')
  })

  it('falls back to the raw id for an unknown model', () => {
    expect(modelName({ provider: 'openai', model: 'gpt-9-unreleased' })).toBe(
      'gpt-9-unreleased',
    )
  })
})

describe('providerName', () => {
  it('returns the local label for the local provider', () => {
    expect(providerName('local', 'On this computer')).toBe('On this computer')
  })
})
