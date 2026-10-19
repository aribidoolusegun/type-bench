import { useEffect, useRef, useState } from 'react'
import { usePresence } from '../motion/motion.ts'
import type { Announcement } from '../state/useAnnouncer.ts'
import { Close } from './Icons.tsx'

interface ToastProps {
  message: Announcement | null
  onDismiss: () => void
}

/**
 * Visible feedback plus a live region for screen readers. The live region
 * is always in the DOM so that new messages are reliably announced.
 */
export function Toast({ message, onDismiss }: ToastProps) {
  const [paused, setPaused] = useState(false)
  const presence = usePresence(message !== null)
  // Keep the last message on screen while the toast fades out.
  const last = useRef(message)
  if (message) last.current = message
  const shown = message ?? last.current

  // The toast's buttons disappear with it, so send focus somewhere sensible.
  function close() {
    const target = shown?.action?.returnFocus
    onDismiss()
    if (target?.isConnected) target.focus()
  }

  useEffect(() => {
    if (!message || paused) return
    const timer = window.setTimeout(onDismiss, message.action ? 8000 : 4000)
    return () => window.clearTimeout(timer)
  }, [message, paused, onDismiss])

  return (
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {message?.text}
      </div>
      {presence.mounted && shown && (
        <div
          key={shown.id}
          data-state={presence.closing ? 'closing' : 'open'}
          className={`toast is-${shown.tone}`}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <span aria-hidden="true">{shown.text}</span>
          {shown.action && message && (
            <button
              type="button"
              className="toast__action"
              onClick={() => {
                message.action?.run()
                close()
              }}
            >
              {shown.action.label}
            </button>
          )}
          <button type="button" className="toast__close" aria-label="Dismiss message" onClick={close}>
            <Close />
          </button>
        </div>
      )}
    </>
  )
}
