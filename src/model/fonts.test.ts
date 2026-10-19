import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { FONTS, fontFileUrls, getFont, nearestSupportedWeight, strongWeightFor, supportedWeights, weightRangeLabel } from './fonts.ts'
import { createDefaultSettings, defaultWidthsFor } from './settings.ts'
import { settingsReducer } from '../state/settingsReducer.ts'

const publicDir = fileURLToPath(new URL('../../public/', import.meta.url))

describe('font catalogue', () => {
  it('has 12 families: 10 sans serif and 2 serif', () => {
    assert.equal(FONTS.length, 12)
    assert.equal(FONTS.filter((f) => f.category === 'sans-serif').length, 10)
    assert.deepEqual(
      FONTS.filter((f) => f.category === 'serif').map((f) => f.name),
      ['Lora', 'Merriweather'],
    )
  })

  it('ships every file and licence it references', () => {
    for (const font of FONTS) {
      for (const url of fontFileUrls(font, supportedWeights(font))) assert.ok(existsSync(publicDir + url), url)
      assert.ok(existsSync(`${publicDir}fonts/${font.id}/OFL.txt`), `${font.id} licence`)
    }
  })

  it('offers only weights inside each file’s real range', () => {
    assert.deepEqual(supportedWeights(getFont('lora')), [400, 500, 600, 700])
    assert.deepEqual(supportedWeights(getFont('manrope')), [200, 300, 400, 500, 600, 700, 800])
    assert.deepEqual(supportedWeights(getFont('open-sans')), [300, 400, 500, 600, 700, 800])
    assert.deepEqual(supportedWeights(getFont('poppins')), [100, 200, 300, 400, 500, 600, 700, 800, 900])
    for (const font of FONTS) {
      for (const w of supportedWeights(font)) {
        assert.ok(w >= font.weightRange[0] && w <= font.weightRange[1], `${font.id} ${w}`)
      }
    }
  })

  it('offers exactly the range the shipped files cover, and labels it the same way everywhere', () => {
    for (const font of FONTS) {
      const weights = supportedWeights(font)
      assert.deepEqual([weights[0], weights[weights.length - 1]], [...font.weightRange], font.id)
      assert.equal(weightRangeLabel(font), `${font.weightRange[0]}–${font.weightRange[1]}`, font.id)
    }
    assert.equal(weightRangeLabel(getFont('dm-sans')), '100–1000')
    assert.equal(weightRangeLabel(getFont('nunito-sans')), '200–1000')
  })

  it('picks the nearest supported weight and a heavier emphasis weight', () => {
    assert.equal(nearestSupportedWeight(getFont('lora'), 100), 400)
    assert.equal(nearestSupportedWeight(getFont('manrope'), 900), 800)
    assert.equal(nearestSupportedWeight(getFont('inter'), 300), 300)
    assert.equal(strongWeightFor(getFont('inter'), 400), 600)
    assert.equal(strongWeightFor(getFont('lora'), 600), 700)
    assert.equal(strongWeightFor(getFont('lora'), 700), 700)
  })
})

describe('switching families', () => {
  it('keeps the weight when the new family supports it', () => {
    const start = createDefaultSettings()
    const inter = settingsReducer(
      settingsReducer(start, { type: 'setTypography', patch: { weight: 300 } }),
      { type: 'setFont', fontId: 'inter' },
    )
    assert.equal(inter.typography.weight, 300)
  })

  it('moves to the nearest supported weight when it does not', () => {
    const thin = settingsReducer(createDefaultSettings(), { type: 'setTypography', patch: { weight: 100 } })
    assert.equal(settingsReducer(thin, { type: 'setFont', fontId: 'lora' }).typography.weight, 400)
    const black = settingsReducer(createDefaultSettings(), { type: 'setTypography', patch: { weight: 900 } })
    assert.equal(settingsReducer(black, { type: 'setFont', fontId: 'open-sans' }).typography.weight, 800)
  })

  it('fits first-visit widths to small canvases without changing large-screen defaults', () => {
    assert.deepEqual(defaultWidthsFor(900), createDefaultSettings().preview.widths)
    assert.deepEqual(defaultWidthsFor(372), { editorial: 300, dashboard: 300, mobile: 300 })
    assert.deepEqual(defaultWidthsFor(200), { editorial: 280, dashboard: 280, mobile: 280 })
  })

  it('reset restores defaults but keeps the system name', () => {
    const changed = settingsReducer(
      settingsReducer(createDefaultSettings('My system'), { type: 'setFont', fontId: 'lora' }),
      { type: 'setStress', patch: { longHeadings: true } },
    )
    assert.deepEqual(settingsReducer(changed, { type: 'reset' }), createDefaultSettings('My system'))
  })
})
