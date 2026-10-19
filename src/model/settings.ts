import { DEFAULT_FONT_ID, type FontId } from './fonts.ts'

export type PreviewTab = 'editorial' | 'dashboard' | 'mobile'
export type ContentLength = 'short' | 'standard' | 'long' | 'extended'

export interface Typography {
  fontId: FontId
  /** Base (body) size in px. */
  baseSize: number
  /** Modular scale ratio. */
  ratio: number
  /** Unitless body line height. */
  lineHeight: number
  /** Text weight, always one the selected family supports. */
  weight: number
}

export interface StressSettings {
  contentLength: ContentLength
  longHeadings: boolean
  largeNumbers: boolean
}

export interface PreviewSettings {
  tab: PreviewTab
  /** Each preview keeps its own width: a phone screen and an article page need different defaults. */
  widths: Record<PreviewTab, number>
}

export interface Settings {
  systemName: string
  typography: Typography
  preview: PreviewSettings
  stress: StressSettings
}

export interface NumericBounds {
  min: number
  max: number
  step: number
}

export const BOUNDS = {
  baseSize: { min: 12, max: 24, step: 0.5 },
  ratio: { min: 1.05, max: 1.75, step: 0.005 },
  lineHeight: { min: 1, max: 2.2, step: 0.05 },
  width: { min: 280, max: 1600, step: 1 },
} as const satisfies Record<string, NumericBounds>

export const SYSTEM_NAME_MAX_LENGTH = 80
export const DEFAULT_SYSTEM_NAME = 'Untitled type system'

export const PREVIEW_TABS: readonly PreviewTab[] = ['editorial', 'dashboard', 'mobile']
export const PREVIEW_LABELS: Record<PreviewTab, string> = {
  editorial: 'Editorial',
  dashboard: 'Dashboard',
  mobile: 'Mobile',
}

export const CONTENT_LENGTHS: readonly ContentLength[] = ['short', 'standard', 'long', 'extended']
export const CONTENT_LENGTH_LABELS: Record<ContentLength, string> = {
  short: 'Short',
  standard: 'Standard',
  long: 'Long',
  extended: 'Extended',
}

export const WIDTH_PRESETS: readonly { label: string; width: number }[] = [
  { label: '320', width: 320 },
  { label: '390', width: 390 },
  { label: '768', width: 768 },
  { label: '1024', width: 1024 },
  { label: '1280', width: 1280 },
]

export const DEFAULT_TYPOGRAPHY: Typography = {
  fontId: DEFAULT_FONT_ID,
  baseSize: 16,
  ratio: 1.25,
  lineHeight: 1.5,
  weight: 400,
}

export function createDefaultSettings(systemName = DEFAULT_SYSTEM_NAME): Settings {
  return {
    systemName,
    typography: { ...DEFAULT_TYPOGRAPHY },
    preview: { tab: 'editorial', widths: { editorial: 640, dashboard: 760, mobile: 390 } },
    stress: { contentLength: 'standard', longHeadings: false, largeNumbers: false },
  }
}

/** Horizontal room the canvas gutters and resize handles need. */
const CANVAS_GUTTERS = 72

/**
 * Default preview widths, narrowed to fit when the canvas area is smaller
 * than them (phones and small tablets), so a first visit never opens on a
 * preview that is cut off. Used only for new sessions and Reset; saved
 * widths are always restored exactly.
 */
export function defaultWidthsFor(canvasAreaWidth: number): PreviewSettings['widths'] {
  const defaults = createDefaultSettings().preview.widths
  const room = Math.max(BOUNDS.width.min, Math.floor(canvasAreaWidth - CANVAS_GUTTERS))
  return {
    editorial: Math.min(defaults.editorial, room),
    dashboard: Math.min(defaults.dashboard, room),
    mobile: Math.min(defaults.mobile, room),
  }
}

/**
 * Names the deliberately stressful content that is switched on. Pass a tab to
 * list only what affects that preview (large numbers apply to the dashboard).
 */
export function activeStress(stress: StressSettings, tab?: PreviewTab): string[] {
  const active: string[] = []
  if (stress.contentLength !== 'standard') active.push(`${CONTENT_LENGTH_LABELS[stress.contentLength]} copy`)
  if (stress.longHeadings) active.push('Long headings')
  if (stress.largeNumbers && (tab === undefined || tab === 'dashboard')) active.push('Large numbers')
  return active
}

export const NAMED_RATIOS: readonly { name: string; value: number }[] = [
  { name: 'Minor second', value: 1.067 },
  { name: 'Major second', value: 1.125 },
  { name: 'Minor third', value: 1.2 },
  { name: 'Major third', value: 1.25 },
  { name: 'Perfect fourth', value: 1.333 },
  { name: 'Augmented fourth', value: 1.414 },
  { name: 'Perfect fifth', value: 1.5 },
  { name: 'Golden ratio', value: 1.618 },
]

export function ratioName(ratio: number): string | null {
  return NAMED_RATIOS.find((r) => Math.abs(r.value - ratio) < 0.0005)?.name ?? null
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Parses what someone typed into a numeric field. Returns null for anything
 * that is not a plain decimal number (empty strings, "abc", "1.2.3").
 */
export function parseDecimal(input: string): number | null {
  const trimmed = input.trim().replace(',', '.')
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(trimmed)) return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}

export function normaliseSystemName(name: string): string {
  const cleaned = name.replace(/\s+/g, ' ').trim().slice(0, SYSTEM_NAME_MAX_LENGTH)
  return cleaned || DEFAULT_SYSTEM_NAME
}
