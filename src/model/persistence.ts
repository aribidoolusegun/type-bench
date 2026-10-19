import { getFont, isFontId, nearestSupportedWeight } from './fonts.ts'
import {
  BOUNDS,
  clamp,
  CONTENT_LENGTHS,
  createDefaultSettings,
  isFiniteNumber,
  normaliseSystemName,
  PREVIEW_TABS,
  type ContentLength,
  type NumericBounds,
  type PreviewTab,
  type Settings,
} from './settings.ts'

export const STORAGE_KEY = 'type-bench:settings'
export const STORAGE_VERSION = 1

interface StoredEnvelope {
  version: typeof STORAGE_VERSION
  savedAt: string
  settings: Settings
}

export type RestoreStatus = 'empty' | 'restored' | 'repaired' | 'discarded'

export interface RestoreResult {
  settings: Settings
  status: RestoreStatus
  /** Human-readable notes about anything that had to be corrected. */
  issues: string[]
}

type Rec = Record<string, unknown>

function isRecord(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readNumber(source: Rec, key: string, bounds: NumericBounds, fallback: number, issues: string[], label: string): number {
  const value = source[key]
  if (!isFiniteNumber(value)) {
    if (value !== undefined) issues.push(`${label} was not a number; using ${fallback}.`)
    else issues.push(`${label} was missing; using ${fallback}.`)
    return fallback
  }
  const clamped = clamp(value, bounds.min, bounds.max)
  if (clamped !== value) issues.push(`${label} ${value} was out of range; using ${clamped}.`)
  return clamped
}

function readBoolean(source: Rec, key: string, fallback: boolean, issues: string[], label: string): boolean {
  const value = source[key]
  if (typeof value === 'boolean') return value
  issues.push(`${label} was invalid; using ${fallback ? 'on' : 'off'}.`)
  return fallback
}

function readEnum<T extends string>(source: Rec, key: string, allowed: readonly T[], fallback: T, issues: string[], label: string): T {
  const value = source[key]
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) return value as T
  issues.push(`${label} was invalid; using “${fallback}”.`)
  return fallback
}

/**
 * Validates an untrusted settings object field by field. Anything that cannot
 * be used falls back to its default, so one bad value never discards the rest.
 */
export function validateSettings(input: unknown): { settings: Settings; issues: string[] } {
  const defaults = createDefaultSettings()
  const issues: string[] = []
  if (!isRecord(input)) return { settings: defaults, issues: ['Saved settings were not an object.'] }

  const systemName =
    typeof input.systemName === 'string' ? normaliseSystemName(input.systemName) : (issues.push('System name was invalid.'), defaults.systemName)

  const typoIn = isRecord(input.typography) ? input.typography : (issues.push('Typography settings were missing.'), {})
  const d = defaults.typography
  const fontId = isFontId(typoIn.fontId) ? typoIn.fontId : (issues.push('Font was not recognised; using DM Sans.'), d.fontId)
  const font = getFont(fontId)
  const rawWeight = isFiniteNumber(typoIn.weight) ? typoIn.weight : (issues.push('Weight was invalid.'), d.weight)
  const weight = nearestSupportedWeight(font, rawWeight)
  if (weight !== rawWeight && isFiniteNumber(typoIn.weight)) {
    issues.push(`${font.name} does not support weight ${rawWeight}; using ${weight}.`)
  }

  const typography = {
    fontId,
    baseSize: readNumber(typoIn, 'baseSize', BOUNDS.baseSize, d.baseSize, issues, 'Base size'),
    ratio: readNumber(typoIn, 'ratio', BOUNDS.ratio, d.ratio, issues, 'Scale ratio'),
    lineHeight: readNumber(typoIn, 'lineHeight', BOUNDS.lineHeight, d.lineHeight, issues, 'Line height'),
    weight,
  }

  const previewIn = isRecord(input.preview) ? input.preview : (issues.push('Preview settings were missing.'), {})
  const widthsIn = isRecord(previewIn.widths) ? previewIn.widths : {}
  const widths = { ...defaults.preview.widths }
  for (const tab of PREVIEW_TABS) {
    widths[tab] = Math.round(readNumber(widthsIn, tab, BOUNDS.width, defaults.preview.widths[tab], issues, `${tab} width`))
  }
  const preview = {
    tab: readEnum<PreviewTab>(previewIn, 'tab', PREVIEW_TABS, defaults.preview.tab, issues, 'Preview tab'),
    widths,
  }

  const stressIn = isRecord(input.stress) ? input.stress : (issues.push('Stress-test settings were missing.'), {})
  const ds = defaults.stress
  const stress = {
    contentLength: readEnum<ContentLength>(stressIn, 'contentLength', CONTENT_LENGTHS, ds.contentLength, issues, 'Content length'),
    longHeadings: readBoolean(stressIn, 'longHeadings', ds.longHeadings, issues, 'Long headings'),
    largeNumbers: readBoolean(stressIn, 'largeNumbers', ds.largeNumbers, issues, 'Large numbers'),
  }

  return { settings: { systemName, typography, preview, stress }, issues }
}

export function restoreSettings(raw: string | null): RestoreResult {
  if (raw === null) return { settings: createDefaultSettings(), status: 'empty', issues: [] }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { settings: createDefaultSettings(), status: 'discarded', issues: ['Saved settings could not be read.'] }
  }
  if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION) {
    const note =
      isRecord(parsed) && isFiniteNumber(parsed.version) && parsed.version > STORAGE_VERSION
        ? 'Saved settings came from a newer version of Type Bench.'
        : 'Saved settings used an unknown format.'
    return { settings: createDefaultSettings(), status: 'discarded', issues: [note] }
  }
  const { settings, issues } = validateSettings(parsed.settings)
  return { settings, status: issues.length ? 'repaired' : 'restored', issues }
}

export function serialiseSettings(settings: Settings, now: Date = new Date()): string {
  const envelope: StoredEnvelope = { version: STORAGE_VERSION, savedAt: now.toISOString(), settings }
  return JSON.stringify(envelope)
}

/** Returns usable localStorage, or null when it is blocked, full or missing. */
export function getStorage(): Storage | null {
  try {
    const storage = globalThis.localStorage
    if (!storage) return null
    const probe = '__type-bench-probe__'
    storage.setItem(probe, probe)
    storage.removeItem(probe)
    return storage
  } catch {
    return null
  }
}

export function readStoredSettings(storage: Storage | null): RestoreResult {
  if (!storage) return restoreSettings(null)
  try {
    return restoreSettings(storage.getItem(STORAGE_KEY))
  } catch {
    return restoreSettings(null)
  }
}

export type SaveResult = { ok: true; savedAt: Date } | { ok: false; reason: string }

export function writeSettings(storage: Storage | null, settings: Settings, now: Date = new Date()): SaveResult {
  if (!storage) return { ok: false, reason: 'Browser storage is unavailable.' }
  try {
    storage.setItem(STORAGE_KEY, serialiseSettings(settings, now))
    return { ok: true, savedAt: now }
  } catch (error) {
    const quota = error instanceof DOMException && error.name === 'QuotaExceededError'
    return { ok: false, reason: quota ? 'Browser storage is full.' : 'The browser refused to save.' }
  }
}
