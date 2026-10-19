import { useId, useState, type ReactNode } from 'react'

/**
 * Secondary explanations live behind a small “?” button so the panels stay
 * scannable. The button is a real disclosure (aria-expanded/aria-controls), so
 * it works with the keyboard and screen readers.
 */
export function useHelp(topic: string) {
  const id = useId()
  const [open, setOpen] = useState(false)

  const button = (
    <button
      type="button"
      className="help-button"
      aria-expanded={open}
      aria-controls={id}
      aria-label={`About ${topic}`}
      title={`About ${topic}`}
      onClick={() => setOpen((o) => !o)}
    >
      {/* Drawn on the same 16px grid and 1.5 stroke as every other icon. */}
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M6.2 6.3a1.85 1.85 0 0 1 3.6.6c0 1.25-1.8 1.5-1.8 2.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="8" cy="11.6" r="0.85" fill="currentColor" />
      </svg>
    </button>
  )

  const panel = (content: ReactNode) => (
    <div id={id} className="help-panel" hidden={!open}>
      {content}
    </div>
  )

  return { button, panel }
}
