import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { usePresence } from '../../motion/motion.ts'
import type { LoadStatus } from '../../fonts/fontLoader.ts'
import { activeStress, BOUNDS, PREVIEW_LABELS, type Settings } from '../../model/settings.ts'
import { cssVariables, trimNumber, type TypeTokens } from '../../model/tokens.ts'
import { SliderField } from '../controls/SliderField.tsx'
import { Alert } from '../Icons.tsx'
import { DashboardSpecimen } from '../specimens/DashboardSpecimen.tsx'
import { EditorialSpecimen } from '../specimens/EditorialSpecimen.tsx'
import { MobileSpecimen } from '../specimens/MobileSpecimen.tsx'
import type { Highlight } from './HighlightOverlay.tsx'
import { PreviewTabs, tabId } from './PreviewTabs.tsx'
import { ResizableCanvas } from './ResizableCanvas.tsx'

interface PreviewAreaProps {
  settings: Settings
  tokens: TypeTokens
  fontStatus: LoadStatus
  specimenRef: RefObject<HTMLDivElement | null>
  onTabChange: (tab: Settings['preview']['tab']) => void
  onWidthChange: (width: number) => void
  onDraggingChange: (dragging: boolean) => void
  onRetryFont: () => void
  onClearStress: () => void
  highlight: Highlight | null
  onHighlightDone: () => void
}

const PANEL_ID = 'preview-panel'
const CANVAS_ID = 'preview-canvas'

/** Reads the specimen's real rendered width, rather than echoing the setting. */
function useRenderedWidth(ref: RefObject<HTMLElement | null>): number | null {
  const [width, setWidth] = useState<number | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.round(entry.borderBoxSize[0]?.inlineSize ?? entry.contentRect.width))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return width
}

export function PreviewArea({
  settings,
  tokens,
  fontStatus,
  specimenRef,
  onTabChange,
  onWidthChange,
  onDraggingChange,
  onRetryFont,
  onClearStress,
  highlight,
  onHighlightDone,
}: PreviewAreaProps) {
  const { tab } = settings.preview
  const width = settings.preview.widths[tab]
  const { contentLength, longHeadings, largeNumbers } = settings.stress
  const rendered = useRenderedWidth(specimenRef)
  const font = tokens.font
  const loading = fontStatus === 'loading' || fontStatus === 'idle'
  const t = settings.typography
  const stressed = activeStress(settings.stress, tab)
  const stressNotice = usePresence(stressed.length > 0)
  // While the notice fades out, keep showing what it said rather than an empty list.
  const lastStress = useRef(stressed)
  if (stressed.length > 0) lastStress.current = stressed
  const shownStress = stressed.length > 0 ? stressed : lastStress.current

  const colophon = `Set in ${font.name} at ${trimNumber(t.baseSize, 2)}px, weight ${t.weight}, on a ${trimNumber(t.ratio, 3)} scale.`

  return (
    <div className="workspace-inner">
      <div className="workspace-bar">
        <h2 id="preview-title" className="sr-only">
          Live preview
        </h2>
        <PreviewTabs tab={tab} panelId={PANEL_ID} onChange={onTabChange} />
        <div className="workspace-bar__width">
          <SliderField
            label="Width"
            unit="px"
            value={width}
            {...BOUNDS.width}
            decimals={0}
            snap
            slider={false}
            className="field--inline"
            onChange={onWidthChange}
          />
        </div>
      </div>

      <div
        id={PANEL_ID}
        className="canvas-scroller"
        role="tabpanel"
        aria-labelledby={tabId(tab)}
        aria-describedby="canvas-help"
        tabIndex={0}
      >
        <p id="canvas-help" className="sr-only">
          {PREVIEW_LABELS[tab]} preview, {width} pixels wide. This area scrolls when the preview is wider than the window. Use the
          resize handles or the width field to change the width.
        </p>

        {/* Notices float over the canvas gutter in a zero-height layer, so
            showing or hiding one never moves the specimen. */}
        <div className="notice-layer">
          {loading && (
            <div className="notice" role="status">
              <span className="spinner" aria-hidden="true" /> Loading {font.name}… The preview is dimmed until it arrives.
            </div>
          )}
          {stressNotice.mounted && (
            <div className="notice is-test" data-state={stressNotice.closing ? 'closing' : 'open'}>
              <span className="notice__dot" aria-hidden="true" />
              <span>
                <span className="notice__label">Test content:</span> {shownStress.join(' · ')}
              </span>
              <button
                type="button"
                className="text-button"
                onClick={onClearStress}
                tabIndex={stressNotice.closing ? -1 : undefined}
              >
                Restore normal
              </button>
            </div>
          )}
          {fontStatus === 'error' && (
            <div className="notice is-error" role="alert">
              <Alert />
              <span>
                {font.name} didn’t load, so this preview is showing a fallback{' '}
                {font.category === 'serif' ? 'serif' : 'sans-serif'} font, not {font.name}.
              </span>
              <button type="button" className="text-button" onClick={onRetryFont}>
                Retry
              </button>
            </div>
          )}
        </div>

        <ResizableCanvas
          width={width}
          onWidthChange={onWidthChange}
          onDraggingChange={onDraggingChange}
          canvasId={CANVAS_ID}
          highlight={highlight}
          onHighlightDone={onHighlightDone}
          caption={
            // The measured width, beside the specimen: the preview is never scaled to fit the screen.
            stressNotice.mounted ? null : (
              <>
                Actual size · <span className="num">{rendered ?? width}</span> px wide
              </>
            )
          }
        >
          <div
            ref={specimenRef}
            className={`specimen specimen--${tab}`}
            style={cssVariables(tokens) as CSSProperties}
            data-font-state={fontStatus}
            aria-busy={loading || undefined}
          >
            {/* Keyed by tab so each switch plays one brief opacity fade.
                Opacity only: geometry, and therefore measurement, is unaffected. */}
            <div key={tab} className="specimen__view">
              {tab === 'editorial' && <EditorialSpecimen length={contentLength} longHeadings={longHeadings} colophon={colophon} />}
              {tab === 'dashboard' && (
                <DashboardSpecimen length={contentLength} longHeadings={longHeadings} largeNumbers={largeNumbers} />
              )}
              {tab === 'mobile' && <MobileSpecimen length={contentLength} longHeadings={longHeadings} />}
            </div>
          </div>
        </ResizableCanvas>
      </div>
    </div>
  )
}
