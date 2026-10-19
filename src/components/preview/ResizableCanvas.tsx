import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { BOUNDS, clamp } from '../../model/settings.ts'
import { HighlightOverlay, type Highlight } from './HighlightOverlay.tsx'

type Side = 'left' | 'right'

interface ResizableCanvasProps {
  width: number
  onWidthChange: (width: number) => void
  onDraggingChange: (dragging: boolean) => void
  canvasId: string
  children: ReactNode
  highlight: Highlight | null
  onHighlightDone: () => void
  /** A quiet label above the canvas; hidden while dragging, when the width badge takes over. */
  caption?: ReactNode
}

interface DragState {
  side: Side
  pointerId: number
  startX: number
  startWidth: number
}

/**
 * A centred canvas with a drag handle on each edge. Width changes are real
 * CSS width changes, so the specimen reflows exactly as it would in a
 * browser window of that width; nothing is scaled.
 */
export function ResizableCanvas({
  width,
  onWidthChange,
  onDraggingChange,
  canvasId,
  children,
  highlight,
  onHighlightDone,
  caption,
}: ResizableCanvasProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const drag = useRef<DragState | null>(null)
  const pending = useRef<number | null>(null)
  const frame = useRef<number | undefined>(undefined)
  const [dragging, setDragging] = useState<Side | null>(null)

  useEffect(() => () => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current)
  }, [])

  // Pointer moves can fire far more often than the screen refreshes; apply
  // at most one width change per frame.
  function flush() {
    frame.current = undefined
    if (pending.current !== null) onWidthChange(pending.current)
    pending.current = null
  }

  function start(side: Side, event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    event.currentTarget.focus({ preventScroll: true })
    drag.current = { side, pointerId: event.pointerId, startX: event.clientX, startWidth: width }
    setDragging(side)
    onDraggingChange(true)
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || d.pointerId !== event.pointerId) return
    // The canvas is centred, so each edge moves half the width change.
    const direction = d.side === 'right' ? 1 : -1
    const next = clamp(Math.round(d.startWidth + (event.clientX - d.startX) * direction * 2), BOUNDS.width.min, BOUNDS.width.max)
    pending.current = next
    frame.current ??= requestAnimationFrame(flush)
  }

  function end(event: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d || d.pointerId !== event.pointerId) return
    drag.current = null
    if (frame.current !== undefined) cancelAnimationFrame(frame.current)
    flush()
    setDragging(null)
    onDraggingChange(false)
  }

  function onKeyDown(side: Side, event: KeyboardEvent<HTMLDivElement>) {
    const outward = side === 'right' ? 'ArrowRight' : 'ArrowLeft'
    const inward = side === 'right' ? 'ArrowLeft' : 'ArrowRight'
    const step = event.shiftKey ? 50 : 10
    let next: number | null = null
    if (event.key === outward || event.key === 'ArrowUp') next = width + step
    else if (event.key === inward || event.key === 'ArrowDown') next = width - step
    else if (event.key === 'Home') next = BOUNDS.width.min
    else if (event.key === 'End') next = BOUNDS.width.max
    if (next === null) return
    event.preventDefault()
    onWidthChange(clamp(next, BOUNDS.width.min, BOUNDS.width.max))
  }

  const handle = (side: Side) => (
    <div
      className={`resize-handle resize-handle--${side}${dragging === side ? ' is-dragging' : ''}`}
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-controls={canvasId}
      aria-label={`Resize preview from the ${side} edge`}
      aria-valuemin={BOUNDS.width.min}
      aria-valuemax={BOUNDS.width.max}
      aria-valuenow={width}
      aria-valuetext={`${width} pixels wide`}
      onPointerDown={(e) => start(side, e)}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onKeyDown={(e) => onKeyDown(side, e)}
    >
      <span className="resize-handle__grip" aria-hidden="true" />
    </div>
  )

  return (
    <div className={`canvas-track${dragging ? ' is-dragging' : ''}`}>
      <div ref={frameRef} className="canvas-frame" style={{ width }}>
        {handle('left')}
        <div id={canvasId} className="canvas">
          {children}
        </div>
        {handle('right')}
        <HighlightOverlay highlight={highlight} frameRef={frameRef} onDone={onHighlightDone} />
        {caption && !dragging && (
          <p className="canvas-caption" aria-hidden="true">
            {caption}
          </p>
        )}
        {dragging && (
          <div className="canvas-width-badge" aria-hidden="true">
            {width} px
          </div>
        )}
      </div>
    </div>
  )
}
