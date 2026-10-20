export type OnlineProviderId = 'openai' | 'anthropic' | 'gemini'
export type AiProviderId = 'local' | OnlineProviderId

export interface AiChoice {
  provider: AiProviderId
  // Local: id of the downloaded model. Online: the provider's model id.
  model: string
}

export interface ModelOption {
  id: string
  name: string
  recommended?: boolean
}

interface OnlineProvider {
  name: string
  // Where the user gets the key.
  keyUrl: string
  models: ModelOption[]
}

// Adding a model here = shipping a release. The recommended one is the fastest and cheapest.
export const ONLINE_PROVIDERS: Record<OnlineProviderId, OnlineProvider> = {
  openai: {
    name: 'OpenAI (ChatGPT)',
    keyUrl: 'platform.openai.com/api-keys',
    models: [
      { id: 'gpt-6-luna', name: 'GPT-6 Luna', recommended: true },
      { id: 'gpt-6.1-sol', name: 'GPT-6.1 Sol' },
    ],
  },
  anthropic: {
    name: 'Anthropic (Claude)',
    keyUrl: 'platform.claude.com/settings/keys',
    models: [
      { id: 'claude-haiku-5-5', name: 'Claude Haiku 5.5', recommended: true },
      { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5' },
    ],
  },
  gemini: {
    name: 'Google (Gemini)',
    keyUrl: 'aistudio.google.com/apikey',
    models: [
      {
        id: 'gemini-3.5-flash-lite',
        name: 'Gemini 3.5 Flash-Lite',
        recommended: true,
      },
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash' },
    ],
  },
}

export const ONLINE_IDS = Object.keys(ONLINE_PROVIDERS) as OnlineProviderId[]

// `localModel` = the translated label for the local one.
export function providerName(id: AiProviderId, localModel: string) {
  return id === 'local' ? localModel : ONLINE_PROVIDERS[id].name
}

export function modelName(choice: AiChoice) {
  if (choice.provider === 'local') return choice.model
  const option = ONLINE_PROVIDERS[choice.provider].models.find(
    m => m.id === choice.model,
  )
  return option?.name ?? choice.model
}
