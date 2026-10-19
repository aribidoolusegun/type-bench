import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { computeScale, HEADING_LINE_HEIGHTS, ROLE_STEPS, sizeForStep } from './typeScale.ts'

const close = (actual: number, expected: number, epsilon = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < epsilon, `expected ${actual} ≈ ${expected}`)

describe('type scale', () => {
  it('uses the documented steps for each role', () => {
    assert.deepEqual(ROLE_STEPS, { display: 6, h1: 5, h2: 4, h3: 3, body: 0, caption: -1 })
  })

  it('computes the defaults (16px × 1.25) at full precision', () => {
    const scale = computeScale({ baseSize: 16, ratio: 1.25, lineHeight: 1.5 })
    const px = Object.fromEntries(scale.map((s) => [s.role, s.px]))
    close(px.caption!, 12.8)
    close(px.body!, 16)
    close(px.h3!, 31.25)
    close(px.h2!, 39.0625)
    close(px.h1!, 48.828125)
    close(px.display!, 61.03515625)
  })

  it('follows base × ratio^step for any input', () => {
    for (const [base, ratio] of [
      [12, 1.067],
      [17.5, 1.333],
      [24, 1.75],
    ] as const) {
      const scale = computeScale({ baseSize: base, ratio, lineHeight: 1.4 })
      for (const step of scale) close(step.px, base * ratio ** ROLE_STEPS[step.role])
    }
  })

  it('caption is base divided by the ratio', () => {
    close(sizeForStep(18, 1.2, -1), 18 / 1.2)
  })

  it('orders roles from largest to smallest', () => {
    const scale = computeScale({ baseSize: 16, ratio: 1.2, lineHeight: 1.5 })
    assert.deepEqual(
      scale.map((s) => s.role),
      ['display', 'h1', 'h2', 'h3', 'body', 'caption'],
    )
    for (let i = 1; i < scale.length; i++) assert.ok(scale[i - 1]!.px > scale[i]!.px)
  })

  it('gives headings their own tighter line heights and body text the control value', () => {
    const scale = computeScale({ baseSize: 16, ratio: 1.25, lineHeight: 1.6 })
    const lh = Object.fromEntries(scale.map((s) => [s.role, s.lineHeight]))
    assert.equal(lh.body, 1.6)
    assert.equal(lh.caption, 1.6)
    assert.equal(lh.display, HEADING_LINE_HEIGHTS.display)
    assert.equal(lh.h1, HEADING_LINE_HEIGHTS.h1)
    assert.ok(lh.display! < lh.h3!)
  })
})
