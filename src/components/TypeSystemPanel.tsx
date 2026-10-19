import type { LoadStatus } from '../fonts/fontLoader.ts'
import { getFont, supportedWeights, WEIGHT_NAMES, type FontId } from '../model/fonts.ts'
import { BOUNDS, NAMED_RATIOS, ratioName, type Typography } from '../model/settings.ts'
import type { TypeTokens } from '../model/tokens.ts'
import { SliderField } from './controls/SliderField.tsx'
import { FontPicker } from './FontPicker.tsx'
import { ScaleList } from './ScaleList.tsx'

interface TypeSystemPanelProps {
  typography: Typography
  tokens: TypeTokens
  fontStatus: LoadStatus
  pendingFontId: FontId | null
  failedFontId: FontId | null
  onChooseFont: (id: FontId) => void
  onChange: (patch: Partial<Omit<Typography, 'fontId'>>) => void
  onRetryFont: () => void
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
  onRetryFont,
}: TypeSystemPanelProps) {
  const font = getFont(typography.fontId)
  const weights = supportedWeights(font)
  const named = ratioName(typography.ratio)

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

      <SliderField
        label="Body line height"
        value={typography.lineHeight}
        {...BOUNDS.lineHeight}
        decimals={2}
        onChange={(lineHeight) => onChange({ lineHeight })}
      />

      <SliderField
        label="Font weight"
        meta={weightName(typography.weight)}
        value={typography.weight}
        min={weights[0] ?? 400}
        max={weights[weights.length - 1] ?? 400}
        step={100}
        decimals={0}
        snap
        valueText={(w) => (weightName(w) ? `${w}, ${weightName(w)}` : String(w))}
        onChange={(weight) => onChange({ weight })}
      />

      <ScaleList tokens={tokens} />
    </div>
  )
}
