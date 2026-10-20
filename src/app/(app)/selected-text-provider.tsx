'use client'

import { createContext, useContext, useState } from 'react'

export interface Selection {
  id: string
  title: string
}

interface Value {
  selected: Selection | null
  select: (selection: Selection) => void
  clear: () => void
}

const SelectedTextContext = createContext<Value | null>(null)
const KEY = 'lexio.selected-text'

// Which text the Study screen reviews. Kept in sessionStorage so a reload
// (the webview reloads on route change in dev) doesn't lose the choice.
function readSelection(): Selection | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Selection) : null
  } catch {
    return null
  }
}

export function SelectedTextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [selected, setSelected] = useState<Selection | null>(readSelection)

  const select = (selection: Selection) => {
    setSelected(selection)
    try {
      sessionStorage.setItem(KEY, JSON.stringify(selection))
    } catch {
      return
    }
  }

  const clear = () => {
    setSelected(null)
    try {
      sessionStorage.removeItem(KEY)
    } catch {
      return
    }
  }

  return (
    <SelectedTextContext value={{ selected, select, clear }}>
      {children}
    </SelectedTextContext>
  )
}

export function useSelectedText() {
  const ctx = useContext(SelectedTextContext)
  if (!ctx) throw new Error('useSelectedText outside SelectedTextProvider')
  return ctx
}
