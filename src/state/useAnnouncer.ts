import { useCallback, useState } from 'react'

export interface Announcement {
  id: number
  text: string
  tone: 'neutral' | 'success' | 'error'
  /** returnFocus: where focus goes after the toast closes, since its buttons vanish with it. */
  action?: { label: string; run: () => void; returnFocus?: HTMLElement | null }
}

let nextId = 1

/** One message at a time, shown as a toast and read out by a live region. */
export function useAnnouncer() {
  const [message, setMessage] = useState<Announcement | null>(null)
  const announce = useCallback((text: string, tone: Announcement['tone'] = 'neutral', action?: Announcement['action']) => {
    setMessage({ id: nextId++, text, tone, action })
  }, [])
  const dismiss = useCallback(() => setMessage(null), [])
  return { message, announce, dismiss }
}
