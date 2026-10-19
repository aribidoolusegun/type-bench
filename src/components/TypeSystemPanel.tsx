import type { LoadStatus } from '../fonts/fontLoader.ts'
import { getFont, supportedWeights, WEIGHT_NAMES, type FontId } from '../model/fonts.ts'
import { BOUNDS, NAMED_RATIOS, ratioName, type SmallScreenHeadings, type Typography } from '../model/settings.ts'
import type { TypeTokens } from '../model/tokens.ts'
import type { TypographyPatch } from '../state/settingsReducer.ts'
import { SliderField } from './controls/SliderField.tsx'
import { Switch } from './controls/Switch.tsx'
import { FontPicker } from './FontPicker.tsx'
import { ScaleList } from './ScaleList.tsx'

interface TypeSystemPanelProps {
  typography: Typography
  tokens: TypeTokens
  fontStatus: LoadStatus
  pendingFontId: FontId | null
  failedFontId: FontId | null
  onChooseFont: (id: FontId) => void
  onChange: (patch: TypographyPatch) => void
  onSmallScreenChange: (patch: Partial<SmallScreenHeadings>) => void
  onRetryFont: () => void
  /** Whether the specimen, at its current width, is using the small-screen sizes. */
  smallScreenActive: boolean
  /** Explains a weight that moved when the font changed; empty otherwise. */
  weightNote: string | null
}

function weightName(weight: number): string | undefined {
  return WEIGHT_NAMES[weight]
}

export function TypeSystemPanel({
  typography,
  tokens,
  fontStatus,
  pendingFontId,
  failedFontId,
  onChooseFont,
  onChange,
  onSmallScreenChange,
  onRetryFont,
  smallScreenActive,
  weightNote,
}: TypeSystemPanelProps) {
  const font = getFont(typography.fontId)
  const weights = supportedWeights(font)
  const named = ratioName(typography.ratio)
  const small = typography.smallScreen
  const weightField = {
    min: weights[0] ?? 400,
    max: weights[weights.length - 1] ?? 400,
    step: 100,
    decimals: 0,
    snap: true,
    valueText: (w: number) => (weightName(w) ? `${w}, ${weightName(w)}` : String(w)),
  }

  return (
    <div className="panel-inner">
      <h2 id="type-system-title" className="panel-title">
        Type system
      </h2>

      <FontPicker
        value={typography.fontId}
        status={fontStatus}
        pendingId={pendingFontId}
        failedId={failedFontId}
        onChoose={onChooseFont}
        onRetry={onRetryFont}
      />

      <SliderField
        label="Base size"
        unit="px"
        value={typography.baseSize}
        {...BOUNDS.baseSize}
        decimals={2}
        onChange={(baseSize) => onChange({ baseSize })}
      />

      <SliderField
        label="Scale ratio"
        meta={small.enabled ? `≥ ${small.breakpoint} px` : undefined}
        value={typography.ratio}
        {...BOUNDS.ratio}
        decimals={3}
        onChange={(ratio) => onChange({ ratio })}
      >
        <div className="field__after">
          <label className="sr-only" htmlFor="ratio-preset">
            Named ratio
          </label>
          <select
            id="ratio-preset"
            className="select"
            value={named ? String(NAMED_RATIOS.find((r) => r.name === named)?.value) : 'custom'}
            onChange={(e) => e.target.value !== 'custom' && onChange({ ratio: Number(e.target.value) })}
          >
            {!named && <option value="custom">Custom ratio</option>}
            {NAMED_RATIOS.map((r) => (
              <option key={r.name} value={r.value}>
                {r.name} · {r.value}
              </option>
            ))}
          </select>
        </div>
      </SliderField>

      <div className="small-screen">
        <Switch
          label="Adjust for small screens"
          checked={small.enabled}
          onChange={(enabled) => onSmallScreenChange({ enabled })}
        />
        {small.enabled && (
          <div className="small-screen__fields" role="group" aria-label="Small-screen headings">
            <SliderField
              label="Small-screen heading ratio"
              shortLabel="Heading ratio"
              meta={`< ${small.breakpoint} px`}
              value={small.ratio ?? typography.ratio}
              {...BOUNDS.ratio}
              decimals={3}
              onChange={(ratio) => onSmallScreenChange({ ratio })}
            />
            <SliderField
              label="Small-screen breakpoint"
              shortLabel="Breakpoint"
              unit="px"
              value={small.breakpoint}
              {...BOUNDS.breakpoint}
              decimals={0}
              snap
              slider={false}
              className="field--tight"
              onChange={(breakpoint) => onSmallScreenChange({ breakpoint })}
            />
            <p className="field__hint">
              When the preview width is below {small.breakpoint} px, Display to H3 use this ratio. Body text stays the same.
            </p>
          </div>
        )}
      </div>

      <SliderField
        label="Body line height"
        value={typography.lineHeight}
        {...BOUNDS.lineHeight}
        decimals={2}
        onChange={(lineHeight) => onChange({ lineHeight })}
      />

      <SliderField
        label="Body weight"
        meta={weightName(typography.bodyWeight)}
        value={typography.bodyWeight}
        {...weightField}
        onChange={(bodyWeight) => onChange({ bodyWeight })}
      />

      <SliderField
        label="Heading weight"
        meta={weightName(typography.headingWeight)}
        value={typography.headingWeight}
        {...weightField}
        onChange={(headingWeight) => onChange({ headingWeight })}
      >
        {/* Always present, so a font change that moves a weight is announced once, politely. */}
        <p className="field__hint weight-note" role="status">
          {weightNote}
        </p>
      </SliderField>

      <ScaleList tokens={tokens} smallScreenActive={smallScreenActive} />
    </div>
  )
}
