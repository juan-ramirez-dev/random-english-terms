export const LANGUAGES = ['en', 'es'] as const
export type Language = (typeof LANGUAGES)[number]

export interface Preferences {
  language: Language
}

export const LOCALES: Record<Language, string> = { en: 'en-US', es: 'es-CO' }

// Before the person picks, the first supported system language wins.
export function detectLanguage(languages: readonly string[]): Language {
  for (const tag of languages) {
    const base = tag.toLowerCase().split('-')[0]
    if (base === 'es' || base === 'en') return base
  }
  return 'en'
}
