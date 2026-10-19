import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildCss, buildCssSections, buildJsonTokens, exportFileNames, googleFontsCssUrl, slugify } from './exportTokens.ts'
import { FONTS, getFont } from './fonts.ts'
import { createDefaultSettings, type Settings } from './settings.ts'
import { buildTokens, cssVariables, ROOT_FONT_SIZE } from './tokens.ts'
import { computeScale } from './typeScale.ts'

function settingsWith(patch: Partial<Settings['typography']>, name = 'Test system'): Settings {
  const s = createDefaultSettings(name)
  return { ...s, typography: { ...s.typography, ...patch } }
}

/** Reads `--name: value;` declarations from the :root block of an export. */
function rootDeclarations(css: string): Map<string, string> {
  const block = css.slice(css.indexOf(':root {'), css.indexOf('}', css.indexOf(':root {')))
  const map = new Map<string, string>()
  for (const match of block.matchAll(/(--[\w-]+):\s*([^;]+);/g)) map.set(match[1]!, match[2]!.trim())
  return map
}

const CASES: Settings[] = [
  createDefaultSettings(),
  settingsWith({ fontId: 'lora', baseSize: 18, ratio: 1.333, lineHeight: 1.65, weight: 500 }),
  settingsWith({ fontId: 'poppins', baseSize: 14.5, ratio: 1.2, lineHeight: 1.4, weight: 300 }),
  settingsWith({ fontId: 'merriweather', baseSize: 20, ratio: 1.618, lineHeight: 1.8, weight: 900 }),
]

describe('CSS export', () => {
  for (const settings of CASES) {
    const t = settings.typography
    it(`matches the preview variables exactly for ${t.fontId} ${t.baseSize}/${t.ratio}`, () => {
      const declared = rootDeclarations(buildCss(settings))
      const preview = cssVariables(buildTokens(t))
      assert.equal(declared.size, Object.keys(preview).length)
      for (const [name, value] of Object.entries(preview)) assert.equal(declared.get(name), value, name)
    })

    it(`rem sizes convert back to the computed pixel sizes for ${t.fontId}`, () => {
      const declared = rootDeclarations(buildCss(settings))
      for (const step of computeScale(t)) {
        const rem = parseFloat(declared.get(`--font-size-${step.role}`) ?? 'NaN')
        assert.ok(Math.abs(rem * ROOT_FONT_SIZE - step.px) < 0.001, `${step.role}: ${rem}rem vs ${step.px}px`)
      }
    })
  }

  it('names the exact family with a matching generic fallback', () => {
    const lora = rootDeclarations(buildCss(settingsWith({ fontId: 'lora', weight: 400 })))
    assert.match(lora.get('--font-family-text')!, /^"Lora", .*serif$/)
    assert.doesNotMatch(lora.get('--font-family-text')!, /sans-serif/)
    const inter = rootDeclarations(buildCss(settingsWith({ fontId: 'inter' })))
    assert.match(inter.get('--font-family-text')!, /^"Inter", .*sans-serif$/)
  })

  it('exports only weights the family supports', () => {
    for (const font of FONTS) {
      const settings = settingsWith({ fontId: font.id, weight: 900 })
      const tokens = buildTokens(settings.typography)
      assert.ok(tokens.supportedWeights.includes(tokens.weightText), `${font.id} text`)
      assert.ok(tokens.supportedWeights.includes(tokens.weightStrong), `${font.id} strong`)
    }
  })

  it('includes font-loading guidance and the assumed root size', () => {
    const css = buildCss(settingsWith({ fontId: 'manrope' }))
    assert.match(css, /does not load a font/)
    assert.match(css, /@font-face/)
    assert.match(css, /@fontsource-variable\/manrope/)
    assert.match(css, /"Manrope Variable"/)
    assert.match(css, /16px root font size/)
    assert.match(css, /font-size: var\(--font-size-h1\)/)
    // Buttons must use the family too: form controls do not inherit fonts by default,
    // and the inheriting rule must come before the emphasis weight is applied.
    assert.ok(css.indexOf('font: inherit;') > 0 && css.indexOf('font: inherit;') < css.indexOf('button {\n  font-weight: var(--font-weight-strong)'))
  })

  it('lists one @font-face per needed weight for static Poppins', () => {
    const css = buildCss(settingsWith({ fontId: 'poppins', weight: 400 }))
    assert.match(css, /poppins-latin-400-normal\.woff2/)
    assert.match(css, /poppins-latin-600-normal\.woff2/)
    assert.doesNotMatch(css, /poppins-latin-700-normal\.woff2/)
  })

  it('cannot be broken out of its comment by the system name', () => {
    const css = buildCss({ ...createDefaultSettings('Evil */ body { display: none } /*') })
    const firstComment = css.slice(0, css.indexOf('*/') + 2)
    assert.match(firstComment, /Evil \* \/ body/)
  })
})

describe('CSS export sections', () => {
  for (const settings of CASES) {
    it(`are exactly the parts of the full file for ${settings.typography.fontId}`, () => {
      const css = buildCss(settings)
      const { variables, loading, usage, summary } = buildCssSections(settings)
      assert.ok(css.includes(variables), 'variables block')
      assert.ok(css.includes(usage), 'usage example')
      // The loading notes appear under a numbered heading in the file; the body is identical.
      const body = loading.split('\n').slice(2).join('\n')
      assert.ok(css.includes(body), 'loading notes')
      assert.match(summary, new RegExp(getFont(settings.typography.fontId).name))
    })
  }
})

describe('JSON export', () => {
  for (const settings of CASES) {
    const t = settings.typography
    it(`agrees with the CSS export for ${t.fontId}`, () => {
      const json = buildJsonTokens(settings) as any
      const declared = rootDeclarations(buildCss(settings))
      for (const role of ['display', 'h1', 'h2', 'h3', 'body', 'caption']) {
        const { value, unit } = json.font.size[role].$value
        assert.equal(unit, 'rem')
        assert.equal(`${value}rem`, declared.get(`--font-size-${role}`), role)
        assert.equal(String(json.font.lineHeight[role].$value), declared.get(`--line-height-${role}`), role)
      }
      assert.equal(String(json.font.weight.text.$value), declared.get('--font-weight-text'))
      assert.equal(String(json.font.weight.strong.$value), declared.get('--font-weight-strong'))
      assert.equal(json.font.family.text.$value[0], getFont(t.fontId).name)
    })
  }

  it('is valid JSON with DTCG-style typography composites', () => {
    const json = buildJsonTokens(createDefaultSettings()) as any
    assert.doesNotThrow(() => JSON.parse(JSON.stringify(json)))
    assert.equal(json.typography.h1.$type, 'typography')
    assert.equal(json.typography.h1.$value.fontSize, '{font.size.h1}')
    assert.equal(json.$extensions['type-bench'].rootFontSize, 16)
  })
})

describe('file names and links', () => {
  it('slugifies the system name', () => {
    assert.equal(slugify('Untitled type system'), 'untitled-type-system')
    assert.equal(slugify('  Café / Product UI v2 '), 'cafe-product-ui-v2')
    assert.equal(slugify('***'), 'type-system')
    assert.deepEqual(exportFileNames('Acme Web'), { css: 'acme-web.type-tokens.css', json: 'acme-web.type-tokens.json' })
  })

  it('builds Google Fonts URLs from the real weight ranges', () => {
    assert.match(googleFontsCssUrl(buildTokens(settingsWith({ fontId: 'dm-sans' }).typography)), /DM\+Sans:wght@100\.\.1000/)
    assert.match(googleFontsCssUrl(buildTokens(settingsWith({ fontId: 'poppins', weight: 500 }).typography)), /Poppins:wght@500;700/)
  })
})
