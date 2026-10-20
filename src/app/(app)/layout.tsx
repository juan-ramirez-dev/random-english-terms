import { ViewTransition } from 'react'
import { AppShell } from '@/components/ui/app-shell'
import { PreferencesProvider } from './preferences-provider'
import { SelectedTextProvider } from './selected-text-provider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PreferencesProvider>
      <SelectedTextProvider>
        <AppShell>
          <ViewTransition>{children}</ViewTransition>
        </AppShell>
      </SelectedTextProvider>
    </PreferencesProvider>
  )
}
