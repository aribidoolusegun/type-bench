import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { restoreSettings, serialiseSettings, STORAGE_KEY, STORAGE_VERSION, validateSettings, writeSettings } from './persistence.ts'
import { createDefaultSettings, type Settings } from './settings.ts'

function envelope(settings: unknown, version: unknown = STORAGE_VERSION): string {
  return JSON.stringify({ version, savedAt: '2026-10-19T12:00:00.000Z', settings })
}

describe('restoring settings', () => {
  it('round-trips valid settings unchanged', () => {
    const original: Settings = {
      systemName: 'Product UI',
      typography: { fontId: 'lora', baseSize: 18, ratio: 1.333, lineHeight: 1.6, weight: 600 },
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
    const result = restoreSettings(envelope({ ...stored, typography: { ...stored.typography, fontId: 'lora', weight: 200 } }))
    assert.equal(result.settings.typography.weight, 400)
    assert.equal(result.status, 'repaired')
    const manrope = validateSettings({ ...stored, typography: { ...stored.typography, fontId: 'manrope', weight: 900 } })
    assert.equal(manrope.settings.typography.weight, 800)
  })

  it('cleans up the system name', () => {
    const { settings } = validateSettings({ ...createDefaultSettings(), systemName: '   ' })
    assert.equal(settings.systemName, 'Untitled type system')
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
