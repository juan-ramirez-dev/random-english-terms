import type { SVGProps } from 'react'

// 24px line icons. No library: there are few and they don't change.
const PATHS = {
  library: 'M4 5h5v14H4zM11 5h4v14h-4zM17.5 6l3 12-3.5 1-3-12z',
  study:
    'M4 6a2 2 0 0 1 2-2h5v15H6a2 2 0 0 0-2 2zM20 6a2 2 0 0 0-2-2h-5v15h5a2 2 0 0 1 2 2z',
  words: 'M5 5h14M5 10h14M5 15h9',
  settings: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  arrowLeft: 'M15 6l-6 6 6 6',
  arrowRight: 'M9 6l6 6-6 6',
  arrowUp: 'M12 19V5M6 11l6-6 6 6',
  trash: 'M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13',
  star: 'M12 3l2.6 5.6 6 .7-4.4 4.1 1.2 6-5.4-3-5.4 3 1.2-6L3.4 9.3l6-.7z',
  book: 'M5 5a2 2 0 0 1 2-2h11v16H7a2 2 0 0 0-2 2zM18 19H7',
} as const

export type IconName = keyof typeof PATHS

export function Icon({
  name,
  size = 20,
  ...props
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
