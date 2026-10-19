import type { OverflowItem } from '../diagnostics/measure.ts'
import type { DiagnosticsState } from '../diagnostics/useDiagnostics.ts'
import {
  activeStress,
  BOUNDS,
  CONTENT_LENGTH_LABELS,
  CONTENT_LENGTHS,
  WIDTH_PRESETS,
  type PreviewTab,
  type StressSettings,
} from '../model/settings.ts'
import { useHelp } from './controls/Help.tsx'
import { SliderField } from './controls/SliderField.tsx'
import { Switch } from './controls/Switch.tsx'
import { CssPreview } from './CssPreview.tsx'
import { DiagnosticsPanel } from './DiagnosticsPanel.tsx'

interface StressPanelProps {
  stress: StressSettings
  tab: PreviewTab
  width: number
  diagnostics: DiagnosticsState
  fontName: string
  rootBlock: string
  onWidthChange: (width: number) => void
  onStressChange: (patch: Partial<StressSettings>) => void
  onShowDashboard: () => void
  onCopyCss: () => Promise<boolean>
  onOpenExport: (opener: HTMLElement) => void
  onRevealFinding: (item: OverflowItem) => void
  onClearHighlight: () => void
}

export function StressPanel({
  stress,
  tab,
  width,
  diagnostics,
  fontName,
  rootBlock,
  onWidthChange,
  onStressChange,
  onShowDashboard,
  onCopyCss,
  onOpenExport,
  onRevealFinding,
  onClearHighlight,
}: StressPanelProps) {
  const help = useHelp('Test content')
  const active = activeStress(stress)
  // Name each variation; say when one only affects a preview that is not showing.
  const activeNames = active.map((a) => (a === 'Large numbers' && tab !== 'dashboard' ? 'Large numbers (Dashboard only)' : a))

  return (
    <div className="panel-inner">
      <h2 id="stress-title" className="panel-title">
        Layout testing
      </h2>

      <SliderField label="Viewport width" unit="px" value={width} {...BOUNDS.width} decimals={0} snap onChange={onWidthChange}>
        <div className="presets" role="group" aria-label="Width presets">
          {WIDTH_PRESETS.map((p) => (
            <button
              key={p.width}
              type="button"
              className="chip"
              aria-pressed={width === p.width}
              onClick={() => onWidthChange(p.width)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </SliderField>

      <section className="stress-group" aria-labelledby="stress-content-title">
        <div className="panel-subhead">
          <h3 id="stress-content-title" className="panel-subtitle">
            Test content
          </h3>
          {help.button}
          <span className={`stress-group__state${active.length ? ' is-on' : ''}`}>
            {active.length ? `${active.length} active` : 'Default content'}
          </span>
        </div>
        {active.length > 0 && <p className="stress-group__active">Active: {activeNames.join(' · ')}</p>}
        {help.panel(
          <>
            <p>
              These swap in deliberately difficult copy so you can see where the type system bends. Standard length with
              both switches off is the normal sample.
            </p>
            <p>
              Content length adds or removes coherent copy; long headings lengthen every headline; large numbers grow the
              dashboard’s figures, which don’t wrap and may overflow their cards. None of this predicts every content
              problem, so test with your real copy too.
              {tab !== 'dashboard' && (
                <>
                  {' '}
                  <button type="button" className="text-button" onClick={onShowDashboard}>
                    Show dashboard
                  </button>
                </>
              )}
            </p>
          </>,
        )}

        <div className="field segmented-field">
          <span id="content-length-label" className="field__label">
            Content length
          </span>
          <div className="segmented" role="radiogroup" aria-labelledby="content-length-label">
            {CONTENT_LENGTHS.map((length) => (
              <label key={length} className="segmented__option">
                <input
                  type="radio"
                  name="content-length"
                  value={length}
                  checked={stress.contentLength === length}
                  onChange={() => onStressChange({ contentLength: length })}
                />
                <span>{CONTENT_LENGTH_LABELS[length]}</span>
              </label>
            ))}
          </div>
        </div>

        <Switch
          label="Long headings"
          checked={stress.longHeadings}
          onChange={(longHeadings) => onStressChange({ longHeadings })}
        />

        <Switch
          label="Large numbers"
          checked={stress.largeNumbers}
          onChange={(largeNumbers) => onStressChange({ largeNumbers })}
          badge={<span className="badge">Dashboard only</span>}
        />
      </section>

      <DiagnosticsPanel state={diagnostics} fontName={fontName} onReveal={onRevealFinding} onClearHighlight={onClearHighlight} />

      <CssPreview rootBlock={rootBlock} onCopy={onCopyCss} onOpenExport={onOpenExport} />
    </div>
  )
}
