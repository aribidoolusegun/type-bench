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
/** 2 added body and heading weights and small-screen headings; version 1 is migrated. */
export const STORAGE_VERSION = 2

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
  const readWeight = (key: string, label: string): number => {
    const raw = typoIn[key]
    if (!isFiniteNumber(raw)) {
      issues.push(`${label} was invalid.`)
      return nearestSupportedWeight(font, d.bodyWeight)
    }
    const weight = nearestSupportedWeight(font, raw)
    if (weight !== raw) issues.push(`${font.name} does not support ${label.toLowerCase()} ${raw}; using ${weight}.`)
    return weight
  }

  const ratio = readNumber(typoIn, 'ratio', BOUNDS.ratio, d.ratio, issues, 'Scale ratio')
  const smallIn = isRecord(typoIn.smallScreen) ? typoIn.smallScreen : (issues.push('Small-screen settings were missing.'), {})
  const typography = {
    fontId,
    baseSize: readNumber(typoIn, 'baseSize', BOUNDS.baseSize, d.baseSize, issues, 'Base size'),
    ratio,
    lineHeight: readNumber(typoIn, 'lineHeight', BOUNDS.lineHeight, d.lineHeight, issues, 'Line height'),
    bodyWeight: readWeight('bodyWeight', 'Body weight'),
    headingWeight: readWeight('headingWeight', 'Heading weight'),
    smallScreen: {
      enabled: readBoolean(smallIn, 'enabled', d.smallScreen.enabled, issues, 'Adjust for small screens'),
      // Null means it has never been configured; the reducer fills it in when switched on.
      ratio: isFiniteNumber(smallIn.ratio)
        ? readNumber(smallIn, 'ratio', BOUNDS.ratio, ratio, issues, 'Small-screen heading ratio')
        : (smallIn.ratio != null && issues.push('Small-screen heading ratio was invalid.'), null),
      breakpoint: Math.round(readNumber(smallIn, 'breakpoint', BOUNDS.breakpoint, d.smallScreen.breakpoint, issues, 'Breakpoint')),
    },
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

  const stressIn = isRecord(input.stress) ? input.stress : (issues.push('Layout testing settings were missing.'), {})
  const ds = defaults.stress
  const stress = {
    contentLength: readEnum<ContentLength>(stressIn, 'contentLength', CONTENT_LENGTHS, ds.contentLength, issues, 'Content length'),
    longHeadings: readBoolean(stressIn, 'longHeadings', ds.longHeadings, issues, 'Long headings'),
    largeNumbers: readBoolean(stressIn, 'largeNumbers', ds.largeNumbers, issues, 'Large numbers'),
  }

  return { settings: { systemName, typography, preview, stress }, issues }
}

/**
 * Version 1 had one weight for all text, and headings were set in it; the
 * emphasis weight was derived from it. Using it for both body and headings,
 * with small-screen headings off, reproduces the saved appearance exactly
 * (emphasis is still derived from the body weight).
 */
export function migrateV1(settings: unknown): unknown {
  if (!isRecord(settings) || !isRecord(settings.typography)) return settings
  const { weight, ...rest } = settings.typography
  return {
    ...settings,
    typography: {
      ...rest,
      bodyWeight: weight,
      headingWeight: weight,
      smallScreen: { ...createDefaultSettings().typography.smallScreen },
    },
  }
}

export function restoreSettings(raw: string | null): RestoreResult {
  if (raw === null) return { settings: createDefaultSettings(), status: 'empty', issues: [] }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { settings: createDefaultSettings(), status: 'discarded', issues: ['Saved settings could not be read.'] }
  }
  if (isRecord(parsed) && parsed.version === 1) parsed = { ...parsed, version: STORAGE_VERSION, settings: migrateV1(parsed.settings) }
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
