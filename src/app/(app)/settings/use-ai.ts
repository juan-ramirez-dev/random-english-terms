'use client'

import { useCallback, useEffect, useState } from 'react'
import { listModels, loadChoice, type LocalModel } from '@/lib/api-client/ai'
import type { AiChoice } from '@/lib/ai/catalog'

export interface AiConfig {
  choice: AiChoice | null
  models: LocalModel[]
}

async function loadConfig(): Promise<AiConfig> {
  const [choice, models] = await Promise.all([loadChoice(), listModels()])
  return { choice, models }
}

export function useAi() {
  const [config, setConfig] = useState<AiConfig | null>(null)

  const refresh = useCallback(
    () =>
      loadConfig().then(setConfig, error =>
        console.error('Could not read the AI setup', error),
      ),
    [],
  )

  useEffect(() => {
    let cancelled = false
    loadConfig().then(
      next => {
        if (!cancelled) setConfig(next)
      },
      error => console.error('Could not read the AI setup', error),
    )
    return () => {
      cancelled = true
    }
  }, [])

  return { config, refresh }
}
