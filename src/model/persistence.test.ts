import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { restoreSettings, serialiseSettings, STORAGE_KEY, STORAGE_VERSION, validateSettings, writeSettings } from './persistence.ts'
import { getFont, strongWeightFor } from './fonts.ts'
import { createDefaultSettings, type Settings } from './settings.ts'
import { buildTokens, cssVariables, toRem } from './tokens.ts'
import { computeScale } from './typeScale.ts'

function envelope(settings: unknown, version: unknown = STORAGE_VERSION): string {
  return JSON.stringify({ version, savedAt: '2026-10-19T12:00:00.000Z', settings })
}

describe('restoring settings', () => {
  it('round-trips valid settings unchanged', () => {
    const original: Settings = {
      systemName: 'Product UI',
      typography: {
        fontId: 'lora',
        baseSize: 18,
        ratio: 1.333,
        lineHeight: 1.6,
        bodyWeight: 500,
        headingWeight: 700,
        smallScreen: { enabled: true, ratio: 1.2, breakpoint: 640 },
      },
      preview: { tab: 'mobile', widths: { editorial: 900, dashboard: 1100, mobile: 360 } },
      stress: { contentLength: 'long', longHeadings: true, largeNumbers: true },
    }
    const result = restoreSettings(serialiseSettings(original))
    assert.equal(result.status, 'restored')
    assert.deepEqual(result.settings, original)
    assert.deepEqual(result.issues, [])
  })

  it('returns defaults when nothing is stored', () => {
    const result = restoreSettings(null)
    assert.equal(result.status, 'empty')
    assert.deepEqual(result.settings, createDefaultSettings())
  })

  it('discards unreadable JSON', () => {
    const result = restoreSettings('{not json')
    assert.equal(result.status, 'discarded')
    assert.deepEqual(result.settings, createDefaultSettings())
  })

  it('discards unknown and future versions', () => {
    assert.equal(restoreSettings(envelope(createDefaultSettings(), 0)).status, 'discarded')
    const future = restoreSettings(envelope(createDefaultSettings(), 99))
    assert.equal(future.status, 'discarded')
    assert.match(future.issues[0]!, /newer version/)
  })

  it('clamps out-of-range numbers and keeps the valid fields', () => {
    const stored = createDefaultSettings('Kept name')
    const raw = {
      ...stored,
      typography: { ...stored.typography, baseSize: 400, ratio: 0.5, lineHeight: -2 },
      preview: { tab: 'dashboard', widths: { editorial: 10, dashboard: 99999, mobile: 375 } },
    }
    const result = restoreSettings(envelope(raw))
    assert.equal(result.status, 'repaired')
    assert.equal(result.settings.systemName, 'Kept name')
    assert.equal(result.settings.typography.baseSize, 24)
    assert.equal(result.settings.typography.ratio, 1.05)
    assert.equal(result.settings.typography.lineHeight, 1)
    assert.deepEqual(result.settings.preview.widths, { editorial: 280, dashboard: 1600, mobile: 375 })
    assert.equal(result.settings.preview.tab, 'dashboard')
  })

  it('replaces wrong types with defaults', () => {
    const raw = {
      systemName: 42,
      typography: { fontId: 'comic-sans', baseSize: '16', ratio: null, lineHeight: Number.NaN, weight: 'bold' },
      preview: { tab: 'poster', widths: 'wide' },
      stress: { contentLength: 'huge', longHeadings: 'yes', largeNumbers: 1 },
    }
    const { settings, issues } = validateSettings(raw)
    assert.deepEqual(settings, createDefaultSettings())
    assert.ok(issues.length >= 8)
  })

  it('snaps a weight the restored family lacks to the nearest supported one', () => {
    const stored = createDefaultSettings()
    const result = restoreSettings(envelope({ ...stored, typography: { ...stored.typography, fontId: 'lora', bodyWeight: 200, headingWeight: 800 } }))
    assert.equal(result.settings.typography.bodyWeight, 400)
    assert.equal(result.settings.typography.headingWeight, 700)
    assert.equal(result.status, 'repaired')
    const manrope = validateSettings({ ...stored, typography: { ...stored.typography, fontId: 'manrope', bodyWeight: 900, headingWeight: 900 } })
    assert.equal(manrope.settings.typography.bodyWeight, 800)
    assert.equal(manrope.settings.typography.headingWeight, 800)
  })

  it('cleans up the system name', () => {
    const { settings } = validateSettings({ ...createDefaultSettings(), systemName: '   ' })
    assert.equal(settings.systemName, 'Untitled type system')
  })
})

describe('migrating version 1 settings', () => {
  // Exactly what Type Bench 1 saved: one weight for all text.
  const legacy = {
    systemName: 'Legacy system',
    typography: { fontId: 'lora', baseSize: 18, ratio: 1.333, lineHeight: 1.6, weight: 500 },
    preview: { tab: 'dashboard', widths: { editorial: 900, dashboard: 1100, mobile: 360 } },
    stress: { contentLength: 'long', longHeadings: true, largeNumbers: false },
  }

  it('restores cleanly with the old weight for body and headings, and small screens off', () => {
    const result = restoreSettings(envelope(legacy, 1))
    assert.equal(result.status, 'restored')
    assert.deepEqual(result.issues, [])
    assert.deepEqual(result.settings.typography, {
      fontId: 'lora',
      baseSize: 18,
      ratio: 1.333,
      lineHeight: 1.6,
      bodyWeight: 500,
      headingWeight: 500,
      smallScreen: { enabled: false, ratio: null, breakpoint: 600 },
    })
    assert.deepEqual(result.settings.preview, legacy.preview)
    assert.deepEqual(result.settings.stress, legacy.stress)
  })

  it('renders exactly as version 1 did', () => {
    const tokens = buildTokens(restoreSettings(envelope(legacy, 1)).settings.typography)
    const vars = cssVariables(tokens)
    // Version 1 set headings and body text in the one weight, with emphasis two steps heavier.
    assert.equal(vars['--font-weight-body'], '500')
    assert.equal(vars['--font-weight-heading'], '500')
    assert.equal(vars['--font-weight-strong'], String(strongWeightFor(getFont('lora'), 500)))
    for (const step of computeScale({ baseSize: 18, ratio: 1.333, lineHeight: 1.6 })) {
      assert.equal(vars[`--font-size-${step.role}`], toRem(step.px), step.role)
    }
    assert.equal(tokens.smallScreen, null)
  })

  it('still snaps an unsupported legacy weight, and reports it', () => {
    const result = restoreSettings(envelope({ ...legacy, typography: { ...legacy.typography, weight: 200 } }, 1))
    assert.equal(result.status, 'repaired')
    assert.equal(result.settings.typography.bodyWeight, 400)
    assert.equal(result.settings.typography.headingWeight, 400)
  })

  it('saves in the current version afterwards', () => {
    const migrated = restoreSettings(envelope(legacy, 1)).settings
    assert.equal(JSON.parse(serialiseSettings(migrated)).version, 2)
    assert.equal(STORAGE_VERSION, 2)
  })
})

describe('writing settings', () => {
  function memoryStorage(fail?: Error): Storage {
    const data = new Map<string, string>()
    return {
      get length() {
        return data.size
      },
      clear: () => data.clear(),
      getItem: (k) => data.get(k) ?? null,
      key: (i) => [...data.keys()][i] ?? null,
      removeItem: (k) => void data.delete(k),
      setItem: (k, v) => {
        if (fail) throw fail
        data.set(k, v)
      },
    }
  }

  it('writes a versioned envelope that restores cleanly', () => {
    const storage = memoryStorage()
    const result = writeSettings(storage, createDefaultSettings('Saved'))
    assert.equal(result.ok, true)
    const restored = restoreSettings(storage.getItem(STORAGE_KEY))
    assert.equal(restored.status, 'restored')
    assert.equal(restored.settings.systemName, 'Saved')
  })

  it('reports failure instead of claiming success', () => {
    const full = writeSettings(memoryStorage(new DOMException('full', 'QuotaExceededError')), createDefaultSettings())
    assert.deepEqual(full, { ok: false, reason: 'Browser storage is full.' })
    const none = writeSettings(null, createDefaultSettings())
    assert.equal(none.ok, false)
  })
})
