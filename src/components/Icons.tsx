import type { ReactNode } from 'react'

/** Small stroke icons, drawn on a 16px grid. Decorative unless labelled by their button. */

interface IconProps {
  className?: string
}

function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className ?? 'icon'}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export const ChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6l4 4 4-4" />
  </Svg>
)

export const Check = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 8.5l3 3 6-7" />
  </Svg>
)

export const Search = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="7" cy="7" r="4.25" />
    <path d="M10.25 10.25L13.5 13.5" />
  </Svg>
)

export const Copy = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5.25" y="5.25" width="8" height="8" rx="1" />
    <path d="M10.75 5.25V3.5a.75.75 0 0 0-.75-.75H3.5a.75.75 0 0 0-.75.75V10a.75.75 0 0 0 .75.75h1.75" />
  </Svg>
)

export const Download = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 2.75v7.5M4.75 7.25L8 10.5l3.25-3.25M3 13.25h10" />
  </Svg>
)

export const Reset = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8a5 5 0 1 0 1.6-3.67" />
    <path d="M3 2.75v2.5h2.5" />
  </Svg>
)

export const Close = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </Svg>
)

export const Alert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 2.5l6 10.75H2L8 2.5z" />
    <path d="M8 6.5v3M8 11.5v.01" />
  </Svg>
)
