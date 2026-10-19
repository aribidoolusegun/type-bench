import { useId, useLayoutEffect, useRef, useState } from 'react'
import type { DiagnosticsState } from '../diagnostics/useDiagnostics.ts'
import type { Diagnostics, HeadingMeasure, OverflowItem } from '../diagnostics/measure.ts'
import { useHelp } from './controls/Help.tsx'

interface DiagnosticsPanelProps {
  onClearHighlight: () => void
  onReveal: (item: OverflowItem) => void
  state: DiagnosticsState
  fontName: string
}

const MEASURE_MIN = 45
const MEASURE_MAX = 75

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

/** Groups repeated headings (e.g. several section headings) and keeps the longest. */
function groupHeadings(headings: HeadingMeasure[]) {
  const groups = new Map<string, { lines: number; count: number }>()
  for (const h of headings) {
    const g = groups.get(h.label)
    if (g) {
      g.lines = Math.max(g.lines, h.lines)
      g.count += 1
    } else groups.set(h.label, { lines: h.lines, count: 1 })
  }
  return [...groups.entries()].map(([label, g]) => ({ label, ...g }))
}

interface ItemListProps {
  items: OverflowItem[]
  /** While a new measurement is pending, findings may point at old geometry. */
  stale: boolean
  onReveal: (item: OverflowItem) => void
  /** Collapsing hides findings, so any highlight they made is cleared. */
  onCollapse: () => void
}

/** Findings shown before the rest sit behind “Show N more findings”. */
const VISIBLE_FINDINGS = 4

/**
 * Each finding is a button that reveals and outlines its element in the
 * preview. Focus stays here, so the next finding is one Tab away.
 */
function ItemList({ items, stale, onReveal, onCollapse }: ItemListProps) {
  const listId = useId()
  const [expanded, setExpanded] = useState(false)
  const hidden = items.length - VISIBLE_FINDINGS
  const shown = expanded || hidden <= 0 ? items : items.slice(0, VISIBLE_FINDINGS)
  return (
    <>
      <ul id={listId} className="diag__list">
        {shown.map((item, i) => (
          <li key={i}>
            <button
              type="button"
              className="diag__finding"
              aria-disabled={stale || undefined}
              onClick={() => !stale && onReveal(item)}
            >
              <span className="diag__finding-label">{item.label}</span>
              <span className="num diag__excess">+{item.excess} px</span>
              <span className="diag__finding-action" aria-hidden="true">
                Show
              </span>
              <span className="sr-only">, show in preview</span>
            </button>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        // Focus stays on this button in both directions (disclosure pattern).
        <button
          type="button"
          className="text-button diag__more"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => {
            if (expanded) onCollapse()
            setExpanded(!expanded)
          }}
        >
          {expanded ? 'Show fewer findings' : `Show ${hidden} more ${hidden === 1 ? 'finding' : 'findings'}`}
        </button>
      )}
    </>
  )
}

function Results({ result, stale, onReveal, onCollapse }: { result: Diagnostics } & Omit<ItemListProps, 'items'>) {
  const headings = groupHeadings(result.headings)
  const inContainer = [...result.overflow, ...result.clipped]
  const cpl = result.body?.charsPerLine

  return (
    <dl className="diag__results">
      {headings.map((h) => (
        <div key={h.label} className="diag__row">
          <dt>{h.count > 1 ? `${h.label} (longest of ${h.count})` : h.label}</dt>
          <dd>
            <span className="diag__value num">{plural(h.lines, 'line')}</span>
          </dd>
        </div>
      ))}

      <div className="diag__row">
        <dt>Whole specimen</dt>
        <dd>
          {result.pastEdge === 0 ? (
            <span className="diag__value">
              Fits within <span className="num">{result.specimenWidth} px</span>
            </span>
          ) : (
            <span className="diag__value is-flag">
              Runs <span className="num">{result.pastEdge} px</span> past its edge
            </span>
          )}
        </dd>
      </div>

      <div className="diag__row">
        <dt>Text in its container</dt>
        <dd>
          {inContainer.length === 0 ? (
            <span className="diag__value">Nothing overflows</span>
          ) : (
            <>
              <span className="diag__value is-flag">{plural(inContainer.length, 'element')} overflow</span>
              <ItemList items={inContainer} stale={stale} onReveal={onReveal} onCollapse={onCollapse} />
            </>
          )}
        </dd>
      </div>

      {result.scrollRegions.length > 0 && (
        <div className="diag__row">
          <dt>Scrolls by design</dt>
          <dd>
            <ItemList items={result.scrollRegions} stale={stale} onReveal={onReveal} onCollapse={onCollapse} />
            <span className="diag__note">Deliberate scrolling, not counted as overflow.</span>
          </dd>
        </div>
      )}

      <div className="diag__row">
        <dt>Body line length</dt>
        <dd>
          {cpl === undefined ? (
            <span className="diag__value">No body paragraphs</span>
          ) : (
            <>
              <span className="diag__value num">≈ {cpl} characters</span>
              <span className="diag__note">
                {cpl < MEASURE_MIN
                  ? `Under the ${MEASURE_MIN}–${MEASURE_MAX} often suggested`
                  : cpl > MEASURE_MAX
                    ? `Over the ${MEASURE_MIN}–${MEASURE_MAX} often suggested`
                    : `Within the ${MEASURE_MIN}–${MEASURE_MAX} often suggested`}
              </span>
            </>
          )}
        </dd>
      </div>
    </dl>
  )
}

/** A one-line summary for screen readers; identical results produce no new announcement. */
function verdict(result: Diagnostics): string {
  const contained = result.overflow.length + result.clipped.length
  if (result.pastEdge > 0) return `Layout checks: content runs ${result.pastEdge} pixels past the specimen edge.`
  if (contained > 0) return `Layout checks: ${plural(contained, 'element')} overflow their containers.`
  return 'Layout checks: no overflow found.'
}

export function DiagnosticsPanel({ state, fontName, onReveal, onClearHighlight }: DiagnosticsPanelProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const focusWasInside = useRef(false)
  const latest = state.kind === 'ready' ? state.result : null

  // A refresh can remove the finding that had focus. Rather than dropping
  // focus to the page, move it to the first finding, or to the heading.
  useLayoutEffect(() => {
    if (!latest || !focusWasInside.current) return
    const section = sectionRef.current
    if (!section || section.contains(document.activeElement)) return
    if (document.activeElement && document.activeElement !== document.body) {
      focusWasInside.current = false // focus moved elsewhere on purpose
      return
    }
    const first = section.querySelector<HTMLElement>('.diag__finding')
    ;(first ?? headingRef.current)?.focus()
  }, [latest])

  const help = useHelp('Layout checks')
  const result = state.kind === 'ready' ? state.result : state.kind === 'measuring' ? state.previous : null
  const status =
    state.kind === 'waiting-font'
      ? `Waiting for ${fontName} to load.`
      : state.kind === 'font-error'
        ? `Paused: ${fontName} didn’t load, so results would describe a fallback font.`
        : state.kind === 'measuring'
          ? 'Measuring…'
          : `At ${state.result.specimenWidth} px`

  return (
    <section
      ref={sectionRef}
      className="diag"
      aria-labelledby="diag-title"
      onFocus={() => (focusWasInside.current = true)}
      onBlur={(e) => {
        // Only a move to another real element counts as leaving.
        if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) focusWasInside.current = false
      }}
    >
      <div className="panel-subhead">
        <h3 id="diag-title" ref={headingRef} className="panel-subtitle" tabIndex={-1}>
          Layout checks
        </h3>
        {help.button}
        {/* Visible status only: it changes on every resize, so it is not a live region. */}
        <p className={`panel-meta diag__status${state.kind === 'measuring' ? ' is-measuring' : ''}`}>{status}</p>
      </div>
      {help.panel(
        <>
          <p>
            Measured from the rendered preview with this sample content, after the font has loaded.{' '}
            <strong>Whole specimen</strong> reports content running past the preview’s edge.{' '}
            <strong>Text in its container</strong> reports text wider than its own box, such as a figure overflowing its
            card. Areas that scroll on purpose are listed separately.
          </p>
          <p>
            Line length is an estimate from average character width. These checks describe layout only; they are not an
            accessibility audit.
          </p>
        </>,
      )}
      {/* Announced only when the verdict changes, never per slider tick. */}
      <p className="sr-only" aria-live="polite">
        {result && state.kind !== 'font-error' ? verdict(result) : ''}
      </p>
      {result && state.kind !== 'font-error' && (
        <div className={`diag__body${state.kind === 'measuring' ? ' is-stale' : ''}`} aria-busy={state.kind === 'measuring' || undefined}>
          <Results result={result} stale={state.kind === 'measuring'} onReveal={onReveal} onCollapse={onClearHighlight} />
        </div>
      )}
    </section>
  )
}
