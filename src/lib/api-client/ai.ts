import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import type { AiChoice, OnlineProviderId } from '@/lib/ai/catalog'
import type { ExpressionType } from '@/lib/exercises/types'
import {
  clearAiChoice,
  getAiChoice,
  saveAiChoice,
} from '@/lib/local-db/ai-choice'
import { ApiClientError, isErrorCode, type ErrorParams } from './http'

export interface LocalModel {
  id: string
  name: string
  size: number
  recommended: boolean
  installed: boolean
  // Already downloaded by another app: reuse it instead of downloading.
  importable: boolean
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null

// Rust sends { code, provider?, status? } (src-tauri/src/error.rs).
// Anything else, like a bad argument caught by Tauri, gets the generic message.
export function nativeError(error: unknown) {
  if (!isObject(error) || !isErrorCode(error.code)) {
    return new ApiClientError(422, 'generic')
  }
  const params: ErrorParams = {}
  if (typeof error.provider === 'string') params.provider = error.provider
  if (typeof error.status === 'number') params.status = error.status
  return new ApiClientError(422, error.code, params)
}

async function call<T>(command: string, args?: Record<string, unknown>) {
  try {
    return await invoke<T>(command, args)
  } catch (error) {
    throw nativeError(error)
  }
}

export const loadChoice = getAiChoice

// What the AI is asked for. Mirrors `Task` in src-tauri/src/ai/prompt.rs.
export interface AiTask {
  kind: 'learn'
  items: { phrase: string; type: ExpressionType; sentence: string }[]
}

// The AI's raw JSON. Nothing here checks its shape: see exercises/parse.ts.
export const generate = (choice: AiChoice, task: AiTask) =>
  call<unknown>('ai_generate', {
    provider: choice.provider,
    model: choice.model,
    task,
  })

// The same prompt as text, for the user to paste into Claude.
export const chatPrompt = (task: AiTask) => call<string>('ai_prompt', { task })

export const listModels = () => call<LocalModel[]>('models_status')

export async function downloadModel(
  id: string,
  onProgress: (fraction: number) => void,
) {
  const stop = await listen<{ id: string; downloaded: number; total: number }>(
    'models://progress',
    e => {
      if (e.payload.id === id)
        onProgress(e.payload.downloaded / e.payload.total)
    },
  )
  try {
    await call('model_download', { id })
  } finally {
    stop()
  }
}

export const deleteModel = (id: string) => call('model_delete', { id })

// Reuse a model another app already downloaded (no network).
export const importModel = (id: string) => call('model_import', { id })

// The key is tested and stored in the keychain before the choice is saved.
export async function addOnlineProvider(
  provider: OnlineProviderId,
  model: string,
  key: string,
) {
  await call('ai_save_key', { provider, key })
  await saveAiChoice({ provider, model })
}

// The model is downloaded in the UI first; here it just becomes the choice.
export async function addLocalProvider(model: string) {
  await saveAiChoice({ provider: 'local', model })
}

// Removing = also deleting the key from the keychain or the model from disk.
export async function removeChoice(choice: AiChoice) {
  if (choice.provider === 'local') await deleteModel(choice.model)
  else await call('ai_delete_key', { provider: choice.provider })
  await clearAiChoice()
}
