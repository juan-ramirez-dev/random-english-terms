'use client'

import { createContext, useContext } from 'react'
import { en, type Messages } from './en'
import { es } from './es'
import type { Language, Preferences } from './locale'

export const MESSAGES: Record<Language, Messages> = { en, es }

export interface PreferencesValue {
  prefs: Preferences
  t: Messages
  // Any error → text in the current language.
  error: (error: unknown) => string
  // Returns the error to show, or null if it saved.
  setLanguage: (language: Language) => Promise<string | null>
  refresh: () => Promise<void>
}

export const PreferencesContext = createContext<PreferencesValue | null>(null)

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences outside PreferencesProvider')
  return ctx
}
