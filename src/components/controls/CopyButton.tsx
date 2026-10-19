import { useEffect, useState } from 'react'
import { Check, Copy } from '../Icons.tsx'

interface CopyButtonProps {
  label: string
  onCopy: () => Promise<boolean>
  className?: string
}

const COPIED_MS = 1600

/**
 * Crossfades to a check and “Copied” for a moment after a successful copy,
 * and only then. Both states share one grid cell, so the button keeps the
 * width of the wider one and never changes size. The result is announced by
 * the app's live region, not by this button.
 */
export function CopyButton({ label, onCopy, className = 'button button--secondary' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), COPIED_MS)
    return () => window.clearTimeout(timer)
  }, [copied])

  return (
    <button
      type="button"
      className={`${className} copy-button${copied ? ' is-copied' : ''}`}
      onClick={async () => setCopied(await onCopy())}
    >
      <span className="copy-button__state copy-button__idle" aria-hidden={copied || undefined}>
        <Copy /> {label}
      </span>
      <span className="copy-button__state copy-button__done" aria-hidden={!copied || undefined}>
        <Check /> Copied
      </span>
    </button>
  )
}
