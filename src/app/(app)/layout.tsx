import { ViewTransition } from 'react'
import { AppShell } from '@/components/ui/app-shell'
import { PreferencesProvider } from './preferences-provider'
import { SelectedTextProvider } from './selected-text-provider'
import { UpdateBanner } from './update-banner'
import { UpdateProvider } from './update-provider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PreferencesProvider>
      <SelectedTextProvider>
        <UpdateProvider>
          <AppShell>
            <ViewTransition>{children}</ViewTransition>
          </AppShell>
          <UpdateBanner />
        </UpdateProvider>
      </SelectedTextProvider>
    </PreferencesProvider>
  )
}
