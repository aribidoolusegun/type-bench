import { useEffect, useLayoutEffect, useState, type RefObject } from 'react'

export interface Highlight {
  /** Increments on every activation, so revealing the same finding again restarts the highlight. */
  id: number
  element: Element
  /** Px of content beyond the element's box, shown as a tinted band. */
  excess: number
}

interface HighlightOverlayProps {
  highlight: Highlight | null
  frameRef: RefObject<HTMLElement | null>
  onDone: () => void
}

const HIGHLIGHT_MS = 1800

/**
 * Outlines a diagnostic's element. It is drawn in the canvas frame, outside
 * the measured specimen, and absolutely positioned, so it never changes the
 * layout or the measurements it is pointing at.
 */
export function HighlightOverlay({ highlight, frameRef, onDone }: HighlightOverlayProps) {
  const [rect, setRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null)

  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!highlight || !frame || !highlight.element.isConnected) {
      setRect(null)
      if (highlight) onDone() // the target has gone: drop the obsolete highlight
      return
    }
    const f = frame.getBoundingClientRect()
    const r = highlight.element.getBoundingClientRect()
    setRect({ left: r.left - f.left, top: r.top - f.top, width: r.width, height: r.height })
  }, [highlight, frameRef, onDone])

  useEffect(() => {
    if (!highlight) return
    const timer = window.setTimeout(onDone, HIGHLIGHT_MS)
    return () => window.clearTimeout(timer)
  }, [highlight, onDone])

  if (!highlight || !rect) return null
  return (
    <div
      key={highlight.id}
      className="diag-highlight"
      aria-hidden="true"
      style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
    >
      {highlight.excess > 0 && <span className="diag-highlight__excess" style={{ width: highlight.excess }} />}
    </div>
  )
}
