/**
 * The font catalogue. Every value here was read from the font files in
 * public/fonts (fvar axis ranges, name-table copyright notices), not from
 * marketing pages. See FONTS.md for sources and licences.
 */

export type FontCategory = 'sans-serif' | 'serif'

export type FontId =
  | 'dm-sans'
  | 'inter'
  | 'manrope'
  | 'work-sans'
  | 'source-sans-3'
  | 'roboto'
  | 'open-sans'
  | 'montserrat'
  | 'poppins'
  | 'nunito-sans'
  | 'lora'
  | 'merriweather'

export type FontSource =
  /** One variable file covers the whole weight range. */
  | { kind: 'variable'; file: string }
  /** One static file per weight. */
  | { kind: 'static'; files: Readonly<Record<number, string>> }

export interface FontFamily {
  id: FontId
  /** The CSS family name, exactly as it should appear in font-family. */
  name: string
  category: FontCategory
  /** Weight axis range of the shipped file(s), inclusive. */
  weightRange: readonly [number, number]
  source: FontSource
  /** Copyright notice from the font file's name table. */
  copyright: string
  upstream: string
  googleFontsSlug: string
  /** npm package that ships the same subset, for people who prefer npm. */
  fontsourcePackage: string
  /** Family name that the Fontsource package registers in its own CSS. */
  fontsourceFamilyName: string
}

export const FONT_LICENSE = 'SIL Open Font License 1.1'

export const FALLBACK_STACKS: Record<FontCategory, readonly string[]> = {
  'sans-serif': ['ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
  serif: ['ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
}

function variable(id: string): FontSource {
  return { kind: 'variable', file: `${id}-latin-wght-normal.woff2` }
}

const POPPINS_FILES: Record<number, string> = {}
for (let w = 100; w <= 900; w += 100) POPPINS_FILES[w] = `poppins-latin-${w}-normal.woff2`

export const FONTS: readonly FontFamily[] = [
  {
    id: 'dm-sans',
    name: 'DM Sans',
    category: 'sans-serif',
    weightRange: [100, 1000],
    source: variable('dm-sans'),
    copyright: 'Copyright 2014 The DM Sans Project Authors (https://github.com/googlefonts/dm-fonts)',
    upstream: 'https://github.com/googlefonts/dm-fonts',
    googleFontsSlug: 'DM+Sans',
    fontsourcePackage: '@fontsource-variable/dm-sans',
    fontsourceFamilyName: 'DM Sans Variable',
  },
  {
    id: 'inter',
    name: 'Inter',
    category: 'sans-serif',
    weightRange: [100, 900],
    source: variable('inter'),
    copyright: 'Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)',
    upstream: 'https://github.com/rsms/inter',
    googleFontsSlug: 'Inter',
    fontsourcePackage: '@fontsource-variable/inter',
    fontsourceFamilyName: 'Inter Variable',
  },
  {
    id: 'manrope',
    name: 'Manrope',
    category: 'sans-serif',
    weightRange: [200, 800],
    source: variable('manrope'),
    copyright: 'Copyright 2019 The Manrope Project Authors (https://github.com/sharanda/manrope)',
    upstream: 'https://github.com/sharanda/manrope',
    googleFontsSlug: 'Manrope',
    fontsourcePackage: '@fontsource-variable/manrope',
    fontsourceFamilyName: 'Manrope Variable',
  },
  {
    id: 'work-sans',
    name: 'Work Sans',
    category: 'sans-serif',
    weightRange: [100, 900],
    source: variable('work-sans'),
    copyright: 'Copyright 2019 The Work Sans Project Authors (https://github.com/weiweihuanghuang/Work-Sans)',
    upstream: 'https://github.com/weiweihuanghuang/Work-Sans',
    googleFontsSlug: 'Work+Sans',
    fontsourcePackage: '@fontsource-variable/work-sans',
    fontsourceFamilyName: 'Work Sans Variable',
  },
  {
    id: 'source-sans-3',
    name: 'Source Sans 3',
    category: 'sans-serif',
    weightRange: [200, 900],
    source: variable('source-sans-3'),
    copyright: '© 2023 Adobe (http://www.adobe.com/), with Reserved Font Name ‘Source’',
    upstream: 'https://github.com/adobe-fonts/source-sans',
    googleFontsSlug: 'Source+Sans+3',
    fontsourcePackage: '@fontsource-variable/source-sans-3',
    fontsourceFamilyName: 'Source Sans 3 Variable',
  },
  {
    id: 'roboto',
    name: 'Roboto',
    category: 'sans-serif',
    weightRange: [100, 900],
    source: variable('roboto'),
    copyright: 'Copyright 2011 The Roboto Project Authors (https://github.com/googlefonts/roboto-classic)',
    upstream: 'https://github.com/googlefonts/roboto-classic',
    googleFontsSlug: 'Roboto',
    fontsourcePackage: '@fontsource-variable/roboto',
    fontsourceFamilyName: 'Roboto Variable',
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    category: 'sans-serif',
    weightRange: [300, 800],
    source: variable('open-sans'),
    copyright: 'Copyright 2020 The Open Sans Project Authors (https://github.com/googlefonts/opensans)',
    upstream: 'https://github.com/googlefonts/opensans',
    googleFontsSlug: 'Open+Sans',
    fontsourcePackage: '@fontsource-variable/open-sans',
    fontsourceFamilyName: 'Open Sans Variable',
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    category: 'sans-serif',
    weightRange: [100, 900],
    source: variable('montserrat'),
    copyright: 'Copyright 2011 The Montserrat Project Authors (https://github.com/JulietaUla/Montserrat)',
    upstream: 'https://github.com/JulietaUla/Montserrat',
    googleFontsSlug: 'Montserrat',
    fontsourcePackage: '@fontsource-variable/montserrat',
    fontsourceFamilyName: 'Montserrat Variable',
  },
  {
    id: 'poppins',
    name: 'Poppins',
    category: 'sans-serif',
    weightRange: [100, 900],
    source: { kind: 'static', files: POPPINS_FILES },
    copyright: 'Copyright 2020 The Poppins Project Authors (https://github.com/itfoundry/Poppins)',
    upstream: 'https://github.com/itfoundry/Poppins',
    googleFontsSlug: 'Poppins',
    fontsourcePackage: '@fontsource/poppins',
    fontsourceFamilyName: 'Poppins',
  },
  {
    id: 'nunito-sans',
    name: 'Nunito Sans',
    category: 'sans-serif',
    weightRange: [200, 1000],
    source: variable('nunito-sans'),
    copyright: 'Copyright 2016 The Nunito Sans Project Authors (https://github.com/Fonthausen/NunitoSans)',
    upstream: 'https://github.com/Fonthausen/NunitoSans',
    googleFontsSlug: 'Nunito+Sans',
    fontsourcePackage: '@fontsource-variable/nunito-sans',
    fontsourceFamilyName: 'Nunito Sans Variable',
  },
  {
    id: 'lora',
    name: 'Lora',
    category: 'serif',
    weightRange: [400, 700],
    source: variable('lora'),
    copyright:
      'Copyright 2011 The Lora Project Authors (https://github.com/cyrealtype/Lora-Cyrillic), with Reserved Font Name "Lora"',
    upstream: 'https://github.com/cyrealtype/Lora-Cyrillic',
    googleFontsSlug: 'Lora',
    fontsourcePackage: '@fontsource-variable/lora',
    fontsourceFamilyName: 'Lora Variable',
  },
  {
    id: 'merriweather',
    name: 'Merriweather',
    category: 'serif',
    weightRange: [300, 900],
    source: variable('merriweather'),
    copyright:
      'Copyright 2024 The Merriweather Project Authors (https://github.com/EbenSorkin/Merriweather4) with Reserved Font Name "Merriweather"',
    upstream: 'https://github.com/EbenSorkin/Merriweather4',
    googleFontsSlug: 'Merriweather',
    fontsourcePackage: '@fontsource-variable/merriweather',
    fontsourceFamilyName: 'Merriweather Variable',
  },
]

export const DEFAULT_FONT_ID: FontId = 'dm-sans'

const BY_ID = new Map<string, FontFamily>(FONTS.map((f) => [f.id, f]))

export function isFontId(value: unknown): value is FontId {
  return typeof value === 'string' && BY_ID.has(value)
}

export function getFont(id: FontId): FontFamily {
  const font = BY_ID.get(id)
  if (!font) throw new Error(`Unknown font: ${id}`)
  return font
}

export const CATEGORY_LABELS: Record<FontCategory, string> = {
  'sans-serif': 'Sans serif',
  serif: 'Serif',
}

export const WEIGHT_NAMES: Record<number, string> = {
  100: 'Thin',
  200: 'Extra Light',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'Semibold',
  700: 'Bold',
  800: 'Extra Bold',
  900: 'Black',
  // 1000 has no conventional name; the number is shown on its own.
}

/**
 * Weights the app offers for a family: every hundred inside the range the
 * shipped files actually cover (DM Sans and Nunito Sans reach 1000). This is
 * the single source for the picker, the weight control, help text and exports.
 */
export function supportedWeights(font: FontFamily): number[] {
  if (font.source.kind === 'static') {
    return Object.keys(font.source.files)
      .map(Number)
      .sort((a, b) => a - b)
  }
  const [min, max] = font.weightRange
  const weights: number[] = []
  for (let w = Math.ceil(min / 100) * 100; w <= max; w += 100) weights.push(w)
  return weights
}

/** “100–1000”: the offered weight range, as shown everywhere in the interface. */
export function weightRangeLabel(font: FontFamily): string {
  const weights = supportedWeights(font)
  return `${weights[0]}–${weights[weights.length - 1]}`
}

/** The supported weight closest to `weight`; ties resolve to the lighter one. */
export function nearestSupportedWeight(font: FontFamily, weight: number): number {
  const weights = supportedWeights(font)
  let best = weights[0] ?? 400
  for (const w of weights) {
    if (Math.abs(w - weight) < Math.abs(best - weight)) best = w
  }
  return best
}

/**
 * Moves body and heading weights onto a family's supported weights (keeping
 * any it has), and says plainly what changed. The note is null when nothing
 * had to move, so a font switch that fits stays silent.
 */
export function snapWeights(
  font: FontFamily,
  weights: { bodyWeight: number; headingWeight: number },
): { bodyWeight: number; headingWeight: number; note: string | null } {
  const bodyWeight = nearestSupportedWeight(font, weights.bodyWeight)
  const headingWeight = nearestSupportedWeight(font, weights.headingWeight)
  const changes = [
    ...(bodyWeight !== weights.bodyWeight ? [`body weight ${weights.bodyWeight} is now ${bodyWeight}`] : []),
    ...(headingWeight !== weights.headingWeight ? [`heading weight ${weights.headingWeight} is now ${headingWeight}`] : []),
  ]
  const note = changes.length ? `${font.name} offers weights ${weightRangeLabel(font)}, so ${changes.join(' and ')}.` : null
  return { bodyWeight, headingWeight, note }
}

/**
 * The emphasis weight used for labels, buttons and table headers: two steps
 * heavier than the body weight, limited to what the family supports.
 */
export function strongWeightFor(font: FontFamily, textWeight: number): number {
  const weights = supportedWeights(font)
  const heaviest = weights[weights.length - 1] ?? textWeight
  return nearestSupportedWeight(font, Math.min(textWeight + 200, heaviest))
}

export function fontStack(font: FontFamily): string {
  return [`"${font.name}"`, ...FALLBACK_STACKS[font.category]].join(', ')
}

export function fontFileUrls(font: FontFamily, weights: readonly number[]): string[] {
  if (font.source.kind === 'variable') return [`fonts/${font.id}/${font.source.file}`]
  const files = font.source.files
  return weights.flatMap((w) => (files[w] ? [`fonts/${font.id}/${files[w]}`] : []))
}
