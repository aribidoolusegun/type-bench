import { useEffect, useRef, useState } from 'react'
import { writeSettings, type RestoreResult } from '../model/persistence.ts'
import type { Settings } from '../model/settings.ts'

export type SaveState =
  | { kind: 'unavailable' }
  | { kind: 'not-saved' }
  | { kind: 'restored' }
  | { kind: 'saving' }
  | { kind: 'saved'; at: Date }
  | { kind: 'error'; reason: string }

const SAVE_DELAY_MS = 400

/**
 * Saves settings to localStorage shortly after they change. The status only
 * reads “saved” after the write has actually succeeded.
 */
export function usePersistence(settings: Settings, storage: Storage | null, initial: RestoreResult): SaveState {
  const [state, setState] = useState<SaveState>(() => {
    if (!storage) return { kind: 'unavailable' }
    if (initial.status === 'restored') return { kind: 'restored' }
    return { kind: 'not-saved' }
  })
  // What storage already holds. Repaired or discarded data is treated as
  // unsaved, so the cleaned-up version replaces it straight away.
  const lastWritten = useRef<string | null>(
    initial.status === 'restored' || initial.status === 'empty' ? JSON.stringify(initial.settings) : null,
  )
  // The status that describes `lastWritten`, restored if an edit is undone before it saves.
  const settled = useRef<SaveState>(state)

  useEffect(() => {
    if (!storage) return
    const snapshot = JSON.stringify(settings)
    if (snapshot === lastWritten.current) {
      setState(settled.current)
      return
    }
    setState({ kind: 'saving' })
    const timer = window.setTimeout(() => {
      const result = writeSettings(storage, settings)
      const next: SaveState = result.ok ? { kind: 'saved', at: result.savedAt } : { kind: 'error', reason: result.reason }
      if (result.ok) {
        lastWritten.current = snapshot
        settled.current = next
      }
      setState(next)
    }, SAVE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [settings, storage])

  return state
}
