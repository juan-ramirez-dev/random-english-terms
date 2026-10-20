'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
} from 'react'
import {
  findUpdate,
  installAndRestart,
  type Update,
} from '@/lib/api-client/updater'

interface UpdateState {
  update: Update | null
  checked: boolean
  isChecking: boolean
  isInstalling: boolean
  failed: boolean
  dismissed: boolean
  checkForUpdate: () => void
  install: () => void
  dismiss: () => void
}

const UpdateContext = createContext<UpdateState | null>(null)

// Checks once on mount (app launch) and again whenever Settings asks for it.
export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const [update, setUpdate] = useState<Update | null>(null)
  const [checked, setChecked] = useState(false)
  const [failed, setFailed] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [isChecking, startChecking] = useTransition()
  const [isInstalling, startInstalling] = useTransition()

  const checkForUpdate = useCallback(() => {
    startChecking(async () => {
      setFailed(false)
      setDismissed(false)
      setUpdate(await findUpdate())
      setChecked(true)
    })
  }, [])

  useEffect(() => {
    checkForUpdate()
  }, [checkForUpdate])

  const install = useCallback(() => {
    if (!update) return
    startInstalling(async () => {
      setFailed(false)
      try {
        await installAndRestart(update)
      } catch {
        setFailed(true)
      }
    })
  }, [update])

  const dismiss = useCallback(() => setDismissed(true), [])

  return (
    <UpdateContext.Provider
      value={{
        update,
        checked,
        isChecking,
        isInstalling,
        failed,
        dismissed,
        checkForUpdate,
        install,
        dismiss,
      }}
    >
      {children}
    </UpdateContext.Provider>
  )
}

export function useUpdate(): UpdateState {
  const ctx = useContext(UpdateContext)
  if (!ctx) throw new Error('useUpdate must be used within UpdateProvider')
  return ctx
}
