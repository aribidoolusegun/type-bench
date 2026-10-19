import { useEffect, useRef, useState, type RefObject } from 'react'
import type { LoadStatus } from '../fonts/fontLoader.ts'
import { measureSpecimen, type Diagnostics } from './measure.ts'

export type DiagnosticsState =
  | { kind: 'waiting-font' }
  | { kind: 'font-error' }
  | { kind: 'measuring'; previous: Diagnostics | null }
  | { kind: 'ready'; result: Diagnostics }

const SETTLE_MS = 160

/**
 * Re-measures the specimen after anything that can change its layout:
 * settings, content, preview tab, font loading or a resize. Measurement is
 * debounced and paused while the canvas is being dragged, because reading
 * layout on every pointer move would make resizing stutter.
 */
export function useDiagnostics(
  rootRef: RefObject<HTMLElement | null>,
  layoutKey: string,
  fontStatus: LoadStatus,
  dragging: boolean,
): DiagnosticsState {
  const [state, setState] = useState<DiagnosticsState>({ kind: 'waiting-font' })
  const lastResult = useRef<Diagnostics | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const frame = useRef<number | undefined>(undefined)
  const canMeasure = fontStatus === 'loaded' && !dragging

  useEffect(() => {
    if (fontStatus === 'error') {
      setState({ kind: 'font-error' })
      return
    }
    if (fontStatus !== 'loaded') {
      setState({ kind: 'waiting-font' })
      return
    }

    const cancel = () => {
      window.clearTimeout(timer.current)
      if (frame.current !== undefined) cancelAnimationFrame(frame.current)
    }

    const schedule = () => {
      cancel()
      setState((s) => (s.kind === 'measuring' ? s : { kind: 'measuring', previous: lastResult.current }))
      if (!canMeasure) return
      timer.current = window.setTimeout(() => {
        frame.current = requestAnimationFrame(() => {
          const root = rootRef.current
          if (!root) return
          // document.fonts.ready resolves once pending loads settle, so text
          // is never measured in a fallback face mid-swap.
          void document.fonts.ready.then(() => {
            if (!rootRef.current) return
            const result = measureSpecimen(rootRef.current)
            lastResult.current = result
            setState({ kind: 'ready', result })
          })
        })
      }, SETTLE_MS)
    }

    schedule()
    const root = rootRef.current
    const observer = new ResizeObserver(schedule)
    if (root) observer.observe(root)
    document.fonts.addEventListener('loadingdone', schedule)
    return () => {
      cancel()
      observer.disconnect()
      document.fonts.removeEventListener('loadingdone', schedule)
    }
  }, [rootRef, layoutKey, fontStatus, canMeasure])

  return state
}
