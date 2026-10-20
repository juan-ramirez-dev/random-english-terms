'use client'

import { useEffect, useRef, useState } from 'react'
import { errorMessage } from '@/lib/api-client/http'
import { loadPreferences, storePreferences } from '@/lib/api-client/preferences'
import {
  MESSAGES,
  PreferencesContext,
  type PreferencesValue,
} from '@/lib/i18n/context'
import { detectLanguage, type Preferences } from '@/lib/i18n/locale'

function fromSystem(): Preferences {
  return { language: detectLanguage(navigator.languages) }
}

// Without the database the app still opens with the system language.
const read = () =>
  loadPreferences().then(
    saved => saved ?? fromSystem(),
    () => fromSystem(),
  )

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const latest = useRef<Preferences | null>(null)
  const language = prefs?.language

  const show = (next: Preferences) => {
    latest.current = next
    setPrefs(next)
  }

  useEffect(() => {
    let cancelled = false
    read().then(loaded => {
      if (!cancelled) show(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (language) document.documentElement.lang = language
  }, [language])

  // Nothing renders until the language is known: no flash of the wrong one.
  if (!prefs) return null

  const t = MESSAGES[prefs.language]

  // Shown at once. If saving fails, it goes back.
  const persist = async (next: Preferences) => {
    const before = latest.current
    show(next)
    try {
      await storePreferences(next)
      return null
    } catch (error) {
      if (before) show(before)
      return errorMessage(error, MESSAGES[(before ?? next).language])
    }
  }

  const value: PreferencesValue = {
    prefs,
    t,
    error: error => errorMessage(error, t),
    setLanguage: next => persist({ language: next }),
    refresh: async () => show(await read()),
  }

  return <PreferencesContext value={value}>{children}</PreferencesContext>
}
