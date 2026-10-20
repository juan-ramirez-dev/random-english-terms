import type { Metadata } from 'next'
import { Fraunces, Instrument_Sans } from 'next/font/google'
import { en } from '@/lib/i18n/en'
import './globals.css'

// Self-hosted at build time (no runtime network): feeds --font-display/--font-sans in globals.css.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})
const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
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
    <html
      lang="en"
      className={`${fraunces.variable} ${instrumentSans.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
