import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import { en } from '@/lib/i18n/en'
import './globals.css'

// Self-hosted at build time (no runtime network): feeds --font-sans/--font-display in globals.css.
const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Lexio',
  description: en.meta.description,
}

// `lang` changes at runtime with the saved language (preferences-provider.tsx).
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${nunito.variable}`}>
      <body>{children}</body>
    </html>
  )
}
