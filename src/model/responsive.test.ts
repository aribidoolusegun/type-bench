import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { settingsReducer } from '../state/settingsReducer.ts'
import { demoSettings } from './demo.ts'
import { restoreSettings, serialiseSettings } from './persistence.ts'
import { buildCss, buildCssSections, buildJsonTokens } from './exportTokens.ts'
import { getFont, snapWeights } from './fonts.ts'
import { createDefaultSettings, type Settings } from './settings.ts'
import { buildTokens, cssVariables, ROOT_FONT_SIZE, smallScreenCss, smallScreenRatio, smallScreenVariables } from './tokens.ts'
import { computeScale, HEADING_ROLES, ROLE_STEPS, usesSmallScreen } from './typeScale.ts'

const close = (actual: number, expected: number, epsilon = 1e-9) =>
  assert.ok(Math.abs(actual - expected) < epsilon, `expected ${actual} ≈ ${expected}`)

/** A representative responsive system: Inter, 16px, 1.333 above 640px and 1.2 below. */
function responsive(): Settings {
  const s = createDefaultSettings('Responsive')
  s.typography = {
    ...s.typography,
    fontId: 'inter',
    ratio: 1.333,
    bodyWeight: 400,
    headingWeight: 700,
    smallScreen: { enabled: true, ratio: 1.2, breakpoint: 640 },
  }
  return s
}

/** `--name: value;` declarations inside a block that starts with `opener`. */
function declarationsIn(css: string, opener: string): Map<string, string> {
  const start = css.indexOf(opener)
  assert.ok(start >= 0, `missing ${opener}`)
  const block = css.slice(start, css.indexOf('}', start))
  return new Map([...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]))
}

describe('small-screen heading sizes', () => {
  it('change Display, H1, H2 and H3 only', () => {
    const t = responsive().typography
    const desktop = computeScale(t)
    const small = computeScale(t, smallScreenRatio(t))
    for (const [i, step] of small.entries()) {
      const heading = HEADING_ROLES.includes(step.role)
      close(step.px, 16 * (heading ? 1.2 : 1.333) ** ROLE_STEPS[step.role])
      if (!heading) assert.equal(step.px, desktop[i]!.px, `${step.role} is unchanged`)
      assert.equal(step.lineHeight, desktop[i]!.lineHeight, `${step.role} line height is unchanged`)
    }
  })

  it('apply below the breakpoint and not at or above it', () => {
    const t = responsive().typography
    assert.equal(usesSmallScreen(t, 639), true)
    assert.equal(usesSmallScreen(t, 639.5), true)
    assert.equal(usesSmallScreen(t, 640), false)
    assert.equal(usesSmallScreen(t, 641), false)
    assert.equal(usesSmallScreen({ smallScreen: { ...t.smallScreen, enabled: false } }, 320), false)
  })

  it('leave desktop sizes untouched when the small-screen ratio changes', () => {
    const start = responsive()
    const desktopBefore = cssVariables(buildTokens(start.typography))
    const smaller = settingsReducer(start, { type: 'setSmallScreen', patch: { ratio: 1.1 } })
    assert.deepEqual(cssVariables(buildTokens(smaller.typography)), desktopBefore)
    assert.notDeepEqual(smallScreenVariables(buildTokens(smaller.typography)), smallScreenVariables(buildTokens(start.typography)))
  })

  it('start at the desktop ratio the first time they are switched on, so nothing changes size', () => {
    const start = createDefaultSettings()
    start.typography.ratio = 1.414
    assert.equal(start.typography.smallScreen.ratio, null, 'never configured')
    const on = settingsReducer(start, { type: 'setSmallScreen', patch: { enabled: true } })
    assert.equal(on.typography.smallScreen.ratio, 1.414)
    const tokens = buildTokens(on.typography)
    const desktop = cssVariables(tokens)
    for (const [name, value] of Object.entries(smallScreenVariables(tokens))) assert.equal(value, desktop[name], name)
  })

  it('keep a configured ratio when switched off and on again, even if the scale ratio changed', () => {
    let s = settingsReducer(createDefaultSettings(), { type: 'setSmallScreen', patch: { enabled: true } })
    s = settingsReducer(s, { type: 'setSmallScreen', patch: { ratio: 1.1, breakpoint: 720 } })
    const off = settingsReducer(s, { type: 'setSmallScreen', patch: { enabled: false } })
    // Off disables the effect only: no small-screen sizes or rule, settings kept.
    assert.deepEqual(off.typography.smallScreen, { enabled: false, ratio: 1.1, breakpoint: 720 })
    assert.equal(buildTokens(off.typography).smallScreen, null)
    assert.equal(smallScreenCss(buildTokens(off.typography)), '')
    const moved = settingsReducer(off, { type: 'setTypography', patch: { ratio: 1.5 } })
    const on = settingsReducer(moved, { type: 'setSmallScreen', patch: { enabled: true } })
    assert.deepEqual(on.typography.smallScreen, { enabled: true, ratio: 1.1, breakpoint: 720 })
    assert.equal(buildTokens(on.typography).smallScreen?.ratio, 1.1)
  })

  it('keep a switched-off configuration through save and reload, reset and undo, and the demo', () => {
    let s = settingsReducer(createDefaultSettings('Kept'), { type: 'setSmallScreen', patch: { enabled: true, ratio: 1.12, breakpoint: 680 } })
    s = settingsReducer(s, { type: 'setSmallScreen', patch: { enabled: false } })
    const reloaded = restoreSettings(serialiseSettings(s))
    assert.equal(reloaded.status, 'restored')
    assert.deepEqual(reloaded.settings, s)
    // Reset clears it (back to never configured); Undo replaces the whole system.
    const reset = settingsReducer(s, { type: 'reset' })
    assert.deepEqual(reset.typography.smallScreen, { enabled: false, ratio: null, breakpoint: 600 })
    assert.deepEqual(settingsReducer(reset, { type: 'replace', settings: s }), s)
    // The demo works from a fixed setup and restores the snapshot it took.
    const demo = demoSettings(s)
    assert.equal(demo.typography.smallScreen.enabled, false)
    assert.deepEqual(settingsReducer(demo, { type: 'replace', settings: s }).typography.smallScreen, { enabled: false, ratio: 1.12, breakpoint: 680 })
    // And turning it back on after all that uses the kept ratio.
    const on = settingsReducer(reloaded.settings, { type: 'setSmallScreen', patch: { enabled: true } })
    assert.equal(on.typography.smallScreen.ratio, 1.12)
  })

  it('keep the breakpoint and ratio within range', () => {
    const s = settingsReducer(responsive(), { type: 'setSmallScreen', patch: { breakpoint: 99999.4, ratio: 9 } })
    assert.equal(s.typography.smallScreen.breakpoint, 1600)
    assert.equal(s.typography.smallScreen.ratio, 1.75)
    assert.equal(settingsReducer(s, { type: 'setSmallScreen', patch: { breakpoint: 10 } }).typography.smallScreen.breakpoint, 320)
  })
})

describe('export parity for small screens', () => {
  it('prints the same rule the preview injects, with the container setup', () => {
    const settings = responsive()
    const tokens = buildTokens(settings.typography)
    const css = buildCss(settings)
    const previewRule = smallScreenCss(tokens, { pxComments: false })
    const exported = smallScreenCss(tokens)
    assert.ok(css.includes(exported))
    // Identical apart from the px comments.
    assert.equal(exported.replace(/ \/\*[^*]*\*\//g, ''), previewRule)
    assert.match(css, /\.type-scope \{\n {2}container: type-scope \/ inline-size;\n\}/)
    assert.match(css, /@container type-scope \(width < 640px\) \{\n {2}\.type-scope > \* \{/)
    // The setup and the viewport alternative are explained, not implied.
    assert.match(css, /class="type-scope"/)
    assert.match(css, /not\s+\* the browser window/)
    assert.match(css, /@media \(width < 640px\)/)
    assert.match(buildCssSections(settings).smallScreenSetup ?? '', /class="type-scope"/)
  })

  it('exports exactly the calculated small-screen sizes in CSS and JSON', () => {
    const settings = responsive()
    const css = buildCss(settings)
    const small = declarationsIn(css, '.type-scope > * {')
    const json = buildJsonTokens(settings) as any
    const expected = computeScale(settings.typography, 1.2)
    for (const role of HEADING_ROLES) {
      const px = expected.find((s) => s.role === role)!.px
      const rem = parseFloat(small.get(`--font-size-${role}`) ?? 'NaN')
      assert.ok(Math.abs(rem * ROOT_FONT_SIZE - px) < 0.001, `${role} CSS`)
      assert.equal(`${json.font.size.smallScreen[role].$value.value}rem`, small.get(`--font-size-${role}`), `${role} JSON`)
    }
    assert.equal(small.size, 4, 'only heading sizes change')
    assert.deepEqual(json.breakpoint.smallScreen.$value, { value: 640, unit: 'px' })
    assert.equal(json.$extensions['type-bench'].settings.smallScreen.headingRatio, 1.2)
  })

  it('adds nothing for small screens when the setting is off', () => {
    const settings = createDefaultSettings()
    assert.doesNotMatch(buildCss(settings), /@container|type-scope/)
    const json = buildJsonTokens(settings) as any
    assert.equal(json.font.size.smallScreen, undefined)
    assert.equal(json.breakpoint, undefined)
    assert.equal(buildCssSections(settings).smallScreen, null)
  })
})

describe('body and heading weights', () => {
  it('are separate variables, applied to the right roles in the example', () => {
    const settings = responsive()
    const root = declarationsIn(buildCss(settings), ':root {')
    assert.equal(root.get('--font-weight-body'), '400')
    assert.equal(root.get('--font-weight-heading'), '700')
    assert.equal(root.get('--font-weight-strong'), '600')
    const usage = buildCssSections(settings).usage
    assert.match(usage, /body \{[^}]*font-weight: var\(--font-weight-body\)/)
    for (const sel of ['h1', 'h2', 'h3', '.display']) {
      assert.match(usage, new RegExp(`${sel.replace('.', '\\.')} \\{[^}]*font-weight: var\\(--font-weight-heading\\)`), sel)
    }
    const json = buildJsonTokens(settings) as any
    assert.equal(json.typography.h1.$value.fontWeight, '{font.weight.heading}')
    assert.equal(json.typography.body.$value.fontWeight, '{font.weight.body}')
    assert.equal(json.typography.caption.$value.fontWeight, '{font.weight.body}')
  })

  it('load every weight in use, including the heading weight', () => {
    const settings = createDefaultSettings()
    settings.typography = { ...settings.typography, fontId: 'poppins', bodyWeight: 400, headingWeight: 800 }
    const css = buildCss(settings)
    for (const w of [400, 600, 800]) assert.match(css, new RegExp(`poppins-latin-${w}-normal\\.woff2`))
  })

  it('snap to the new family and explain only what moved', () => {
    assert.deepEqual(snapWeights(getFont('inter'), { bodyWeight: 300, headingWeight: 700 }), {
      bodyWeight: 300,
      headingWeight: 700,
      note: null,
    })
    const lora = snapWeights(getFont('lora'), { bodyWeight: 400, headingWeight: 900 })
    assert.equal(lora.headingWeight, 700)
    assert.equal(lora.note, 'Lora offers weights 400–700, so heading weight 900 is now 700.')
    const both = snapWeights(getFont('lora'), { bodyWeight: 200, headingWeight: 900 })
    assert.equal(both.note, 'Lora offers weights 400–700, so body weight 200 is now 400 and heading weight 900 is now 700.')
  })
})
