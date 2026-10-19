import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DEMO_TYPOGRAPHY, demoSettings } from './demo.ts'
import { validateSettings } from './persistence.ts'
import { createDefaultSettings } from './settings.ts'

describe('stress-test demonstration', () => {
  it('is the same known setup every time, on the dashboard', () => {
    const user = createDefaultSettings('Product UI')
    user.typography = { fontId: 'lora', baseSize: 18, ratio: 1.2, lineHeight: 1.6, weight: 500 }
    user.stress = { contentLength: 'extended', longHeadings: true, largeNumbers: true }
    const demo = demoSettings(user)
    assert.deepEqual(demo.typography, { ...DEMO_TYPOGRAPHY })
    assert.equal(demo.preview.tab, 'dashboard')
    assert.equal(demo.preview.widths.dashboard, 760)
    // Default content: the overflow comes from the type scale, not test content.
    assert.deepEqual(demo.stress, createDefaultSettings().stress)
    assert.deepEqual(demoSettings(createDefaultSettings('Product UI')).typography, demo.typography)
  })

  it('keeps the user’s name and other widths, and does not change their settings object', () => {
    const user = createDefaultSettings('Product UI')
    user.preview.widths.editorial = 900
    const before = structuredClone(user)
    const demo = demoSettings(user)
    assert.equal(demo.systemName, 'Product UI')
    assert.equal(demo.preview.widths.editorial, 900)
    assert.deepEqual(user, before)
  })

  it('is a valid configuration', () => {
    const { issues } = validateSettings(demoSettings(createDefaultSettings()))
    assert.deepEqual(issues, [])
  })
})
