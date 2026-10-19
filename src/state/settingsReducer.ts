import { getFont, nearestSupportedWeight, snapWeights, type FontId } from '../model/fonts.ts'
import {
  BOUNDS,
  clamp,
  createDefaultSettings,
  type PreviewTab,
  type Settings,
  type SmallScreenHeadings,
  type StressSettings,
  type Typography,
} from '../model/settings.ts'

export type SettingsAction =
  | { type: 'setSystemName'; name: string }
  | { type: 'setFont'; fontId: FontId }
  | { type: 'setTypography'; patch: TypographyPatch }
  | { type: 'setSmallScreen'; patch: Partial<SmallScreenHeadings> }
  | { type: 'setTab'; tab: PreviewTab }
  | { type: 'setWidth'; width: number }
  | { type: 'setStress'; patch: Partial<StressSettings> }
  | { type: 'reset'; widths?: Settings['preview']['widths'] }
  | { type: 'replace'; settings: Settings }

export type TypographyPatch = Partial<Omit<Typography, 'fontId' | 'smallScreen'>>

export function settingsReducer(state: Settings, action: SettingsAction): Settings {
  switch (action.type) {
    case 'setSystemName':
      return { ...state, systemName: action.name }
    case 'setFont': {
      // Keep each weight when the new family has it; otherwise move to the
      // nearest weight it does support, so nothing is synthesised.
      const { bodyWeight, headingWeight } = snapWeights(getFont(action.fontId), state.typography)
      return { ...state, typography: { ...state.typography, fontId: action.fontId, bodyWeight, headingWeight } }
    }
    case 'setTypography': {
      const next = { ...state.typography, ...action.patch }
      next.baseSize = clamp(next.baseSize, BOUNDS.baseSize.min, BOUNDS.baseSize.max)
      next.ratio = clamp(next.ratio, BOUNDS.ratio.min, BOUNDS.ratio.max)
      next.lineHeight = clamp(next.lineHeight, BOUNDS.lineHeight.min, BOUNDS.lineHeight.max)
      const font = getFont(next.fontId)
      next.bodyWeight = nearestSupportedWeight(font, next.bodyWeight)
      next.headingWeight = nearestSupportedWeight(font, next.headingWeight)
      return { ...state, typography: next }
    }
    case 'setSmallScreen': {
      const next = { ...state.typography.smallScreen, ...action.patch }
      // The first time it is switched on, start at the scale ratio so nothing
      // changes size. After that the configured ratio is kept, through off and on.
      if (next.enabled && next.ratio === null) next.ratio = state.typography.ratio
      if (next.ratio !== null) next.ratio = clamp(next.ratio, BOUNDS.ratio.min, BOUNDS.ratio.max)
      next.breakpoint = Math.round(clamp(next.breakpoint, BOUNDS.breakpoint.min, BOUNDS.breakpoint.max))
      return { ...state, typography: { ...state.typography, smallScreen: next } }
    }
    case 'setTab':
      return { ...state, preview: { ...state.preview, tab: action.tab } }
    case 'setWidth': {
      const width = Math.round(clamp(action.width, BOUNDS.width.min, BOUNDS.width.max))
      if (width === state.preview.widths[state.preview.tab]) return state
      return {
        ...state,
        preview: { ...state.preview, widths: { ...state.preview.widths, [state.preview.tab]: width } },
      }
    }
    case 'setStress':
      return { ...state, stress: { ...state.stress, ...action.patch } }
    case 'reset': {
      // The system name is the user's own label, so reset leaves it alone.
      const defaults = createDefaultSettings(state.systemName)
      return action.widths ? { ...defaults, preview: { ...defaults.preview, widths: action.widths } } : defaults
    }
    case 'replace':
      return action.settings
  }
}
