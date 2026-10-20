import type { Metadata } from 'next'
import { en } from '@/lib/i18n/en'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lexio',
  description: en.meta.description,
}

// `lang` changes at runtime with the saved language (preferences-provider.tsx).
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
