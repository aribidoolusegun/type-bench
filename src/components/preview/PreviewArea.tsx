import { useRef, type CSSProperties, type RefObject } from 'react'
import { usePresence } from '../../motion/motion.ts'
import type { LoadStatus } from '../../fonts/fontLoader.ts'
import { activeStress, BOUNDS, PREVIEW_LABELS, WIDTH_PRESETS, type Settings } from '../../model/settings.ts'
import { cssVariables, SCOPE_CLASS, smallScreenCss, trimNumber, type TypeTokens } from '../../model/tokens.ts'
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
  /** The specimen's measured width (null before the first layout). */
  renderedWidth: number | null
  /** Whether the specimen is using small-screen heading sizes right now. */
  smallScreenActive: boolean
}

const PANEL_ID = 'preview-panel'
const CANVAS_ID = 'preview-canvas'

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
  renderedWidth: rendered,
  smallScreenActive,
}: PreviewAreaProps) {
  const { tab } = settings.preview
  const width = settings.preview.widths[tab]
  const { contentLength, longHeadings, largeNumbers } = settings.stress
  const font = tokens.font
  const loading = fontStatus === 'loading' || fontStatus === 'idle'
  const t = settings.typography
  const stressed = activeStress(settings.stress, tab)
  const stressNotice = usePresence(stressed.length > 0)
  // While the notice fades out, keep showing what it said rather than an empty list.
  const lastStress = useRef(stressed)
  if (stressed.length > 0) lastStress.current = stressed
  const shownStress = stressed.length > 0 ? stressed : lastStress.current

  const colophon = `Set in ${font.name} at ${trimNumber(t.baseSize, 2)}px on a ${trimNumber(t.ratio, 3)} scale, body weight ${tokens.weightBody}, headings ${tokens.weightHeading}.`
  // The same rule the CSS export prints, so the preview and the export switch at the same width.
  const smallScreenRule = smallScreenCss(tokens, { pxComments: false })

  return (
    <div className="workspace-inner">
      <div className="workspace-bar">
        <h2 id="preview-title" className="sr-only">
          Live preview
        </h2>
        <PreviewTabs tab={tab} panelId={PANEL_ID} onChange={onTabChange} />
        {/* The one width control: it sets the specimen's available layout width. */}
        <div className="workspace-bar__width">
          <SliderField
            label="Preview width"
            unit="px"
            value={width}
            {...BOUNDS.width}
            decimals={0}
            snap
            slider={false}
            className="field--inline"
            onChange={onWidthChange}
          />
          <div className="presets presets--inline" role="group" aria-label="Preview width presets">
            {WIDTH_PRESETS.map((p) => (
              <button
                key={p.width}
                type="button"
                className="chip"
                aria-pressed={width === p.width}
                aria-label={`${p.label} px`}
                onClick={() => onWidthChange(p.width)}
              >
                {p.label}
              </button>
            ))}
          </div>
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
          resize handles, the Preview width field or its presets to change the width.
          {tokens.smallScreen && (smallScreenActive ? ' Headings use the small-screen sizes.' : ' Headings use the desktop sizes.')}
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
                {tokens.smallScreen && (
                  <span className={smallScreenActive ? 'canvas-caption__mode is-small' : 'canvas-caption__mode'}>
                    {' · '}
                    {smallScreenActive ? 'small-screen headings' : 'desktop headings'}
                  </span>
                )}
              </>
            )
          }
        >
          {smallScreenRule && <style>{smallScreenRule}</style>}
          <div
            ref={specimenRef}
            className={`specimen specimen--${tab} ${SCOPE_CLASS}`}
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
