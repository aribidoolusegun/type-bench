import { FALLBACK_STACKS, FONT_LICENSE, WEIGHT_NAMES, weightRangeLabel, type FontFamily } from './fonts.ts'
import { ratioName, type Settings } from './settings.ts'
import {
  buildTokens,
  cssVariables,
  FAMILY_VAR,
  formatPx,
  lineHeightVar,
  ROOT_FONT_SIZE,
  SCOPE_CLASS,
  sizeVar,
  smallScreenCss,
  trimNumber,
  WEIGHT_BODY_VAR,
  WEIGHT_HEADING_VAR,
  WEIGHT_STRONG_VAR,
  type TypeTokens,
} from './tokens.ts'
import { HEADING_ROLES, isHeadingRole, ROLE_LABELS, type TypeRole } from './typeScale.ts'

export const EXPORT_FORMAT_VERSION = 2

function weightLabel(weight: number): string {
  return WEIGHT_NAMES[weight] ? `${weight} (${WEIGHT_NAMES[weight]})` : String(weight)
}

function rangeLabel(font: FontFamily): string {
  return `${font.source.kind === 'variable' ? 'variable' : 'static files'}, weights ${weightRangeLabel(font)}`
}

/** Weights someone needs to load for this system: body, headings and emphasis. */
export function requiredWeights(tokens: TypeTokens): number[] {
  return [...new Set([tokens.weightBody, tokens.weightHeading, tokens.weightStrong])].sort((a, b) => a - b)
}

export function googleFontsCssUrl(tokens: TypeTokens): string {
  const { font } = tokens
  const axis =
    font.source.kind === 'variable'
      ? `${font.weightRange[0]}..${font.weightRange[1]}`
      : requiredWeights(tokens).join(';')
  return `https://fonts.googleapis.com/css2?family=${font.googleFontsSlug}:wght@${axis}&display=swap`
}

function fontFaceExamples(tokens: TypeTokens): string[] {
  const { font } = tokens
  if (font.source.kind === 'variable') {
    return [
      '@font-face {',
      `  font-family: "${font.name}";`,
      `  src: url("/fonts/${font.source.file}") format("woff2");`,
      `  font-weight: ${font.weightRange[0]} ${font.weightRange[1]};`,
      '  font-style: normal;',
      '  font-display: swap;',
      '}',
    ]
  }
  const files = font.source.files
  return requiredWeights(tokens).flatMap((w, i) => [
    ...(i > 0 ? [''] : []),
    '@font-face {',
    `  font-family: "${font.name}";`,
    `  src: url("/fonts/${files[w]}") format("woff2");`,
    `  font-weight: ${w};`,
    '  font-style: normal;',
    '  font-display: swap;',
    '}',
  ])
}

function ratioLabel(ratio: number): string {
  const named = ratioName(ratio)
  return `${trimNumber(ratio, 3)}${named ? ` (${named})` : ''}`
}

function headerLines(settings: Settings, tokens: TypeTokens): string[] {
  const t = settings.typography
  return [
    `${settings.systemName} — typography tokens`,
    'Generated with Type Bench.',
    '',
    `Font:     ${tokens.font.name} (${rangeLabel(tokens.font)}), ${FONT_LICENSE}`,
    `Scale:    ${trimNumber(t.baseSize, 2)}px base × ${ratioLabel(t.ratio)} ratio`,
    ...(tokens.smallScreen
      ? [`          headings × ${ratioLabel(tokens.smallScreen.ratio)} below ${tokens.smallScreen.breakpoint}px (see section 3)`]
      : []),
    `Body:     line height ${trimNumber(t.lineHeight, 3)}, weight ${weightLabel(tokens.weightBody)}`,
    `Headings: weight ${weightLabel(tokens.weightHeading)}`,
    '',
    `Sizes use rem and assume a ${ROOT_FONT_SIZE}px root font size (the browser default).`,
    'If your site changes the root size, every rem value scales with it.',
  ]
}

function loadingGuideLines(tokens: TypeTokens): string[] {
  const { font } = tokens
  const weights = requiredWeights(tokens).join(' and ')
  return [
    'A font-family declaration does not load a font. Make the font available first,',
    'using one of these options:',
    '',
    `A. Self-host. Download the WOFF2 file${font.source.kind === 'static' ? 's' : ''} named below from Fontsource`,
    `   (fontsource.org/fonts/${font.id}; Google Fonts downloads are TTF), keep the OFL`,
    '   licence text with them, and declare them. Update the path to match your site:',
    '',
    ...fontFaceExamples(tokens).map((line) => (line ? `   ${line}` : '')),
    '',
    `B. npm: install ${font.fontsourcePackage} and import it once in your app.`,
    `   Fontsource registers the family as "${font.fontsourceFamilyName}", so change`,
    `   ${FAMILY_VAR} below to start with that name.`,
    '',
    'C. Google Fonts (third-party hosted): add this to your <head>.',
    '   Note: it sends visitor requests to Google.',
    `   <link rel="stylesheet" href="${googleFontsCssUrl(tokens)}">`,
    '',
    `This system uses weight${weights.includes(' and ') ? 's' : ''} ${weights}.`,
  ]
}

function commentBlock(lines: string[]): string {
  // A system name containing "*/" must not be able to close the comment early.
  const safe = lines.map((l) => l.replace(/\*\//g, '* /'))
  return ['/*', ...safe.map((l) => (l ? ` * ${l}` : ' *')), ' */'].join('\n')
}

const ROLE_ORDER: readonly TypeRole[] = ['display', 'h1', 'h2', 'h3', 'body', 'caption']

/**
 * The :root block alone. The full export includes px comments; the narrow
 * sidebar preview leaves them out because the scale table already shows px.
 */
export function buildRootBlock(tokens: TypeTokens, { pxComments = true } = {}): string {
  const vars = cssVariables(tokens)
  const pxByRole = new Map(tokens.scale.map((s) => [s.role, s.px]))
  const lines = [
    ':root {',
    `  ${FAMILY_VAR}: ${vars[FAMILY_VAR]};`,
    '',
    `  ${WEIGHT_BODY_VAR}: ${vars[WEIGHT_BODY_VAR]};`,
    `  ${WEIGHT_HEADING_VAR}: ${vars[WEIGHT_HEADING_VAR]};`,
    `  ${WEIGHT_STRONG_VAR}: ${vars[WEIGHT_STRONG_VAR]};`,
    '',
    ...ROLE_ORDER.map(
      (role) =>
        `  ${sizeVar(role)}: ${vars[sizeVar(role)]};${pxComments ? ` /* ${formatPx(pxByRole.get(role) ?? 0)} */` : ''}`,
    ),
    '',
    ...ROLE_ORDER.map((role) => `  ${lineHeightVar(role)}: ${vars[lineHeightVar(role)]};`),
    '}',
  ]
  return lines.join('\n')
}

/**
 * How the small-screen rule works and what it needs, for the file. Kept next
 * to the rule because without the wrapper class nothing changes.
 */
function smallScreenNotes(tokens: TypeTokens): string[] {
  if (!tokens.smallScreen) return []
  const { breakpoint } = tokens.smallScreen
  return [
    `Below ${breakpoint}px, Display, H1, H2 and H3 use a ${ratioLabel(tokens.smallScreen.ratio)} ratio.`,
    'Body text, captions and line heights stay the same.',
    '',
    'Like the Type Bench preview, this follows the width of a container, not',
    `the browser window. Add class="${SCOPE_CLASS}" to the element that holds`,
    'your content; for a whole page, a wrapper just inside <body>:',
    '',
    '  <body>',
    `    <div class="${SCOPE_CLASS}"> … your page … </div>`,
    '  </body>',
    '',
    `Text outside .${SCOPE_CLASS} keeps the desktop sizes.`,
    '',
    'To follow the browser window instead: delete the .' + SCOPE_CLASS + ' rule, and',
    `replace "@container ${SCOPE_CLASS} (width < ${breakpoint}px)" with`,
    `"@media (width < ${breakpoint}px)" and ".${SCOPE_CLASS} > *" with ":root". The`,
    'window width includes any scrollbar, so that version can switch at a',
    'slightly different width from the preview.',
  ]
}

function usageExample(): string {
  return [
    'body {',
    `  font-family: var(${FAMILY_VAR});`,
    `  font-weight: var(${WEIGHT_BODY_VAR});`,
    `  font-size: var(${sizeVar('body')});`,
    `  line-height: var(${lineHeightVar('body')});`,
    '  font-synthesis: none; /* never fake bold or italic styles */',
    '}',
    '',
    '/* Form controls do not inherit fonts by default. */',
    'button,',
    'input,',
    'select,',
    'textarea {',
    '  font: inherit;',
    '}',
    '',
    ...(['h1', 'h2', 'h3'] as const).flatMap((role) => [
      `${role} {`,
      `  font-size: var(${sizeVar(role)});`,
      `  line-height: var(${lineHeightVar(role)});`,
      `  font-weight: var(${WEIGHT_HEADING_VAR});`,
      '}',
      '',
    ]),
    '.display {',
    `  font-size: var(${sizeVar('display')});`,
    `  line-height: var(${lineHeightVar('display')});`,
    `  font-weight: var(${WEIGHT_HEADING_VAR});`,
    '}',
    '',
    'small,',
    '.caption {',
    `  font-size: var(${sizeVar('caption')});`,
    `  line-height: var(${lineHeightVar('caption')});`,
    '}',
    '',
    'strong,',
    'th,',
    'button {',
    `  font-weight: var(${WEIGHT_STRONG_VAR});`,
    '}',
  ].join('\n')
}

/**
 * The parts of the CSS export, for display. The export dialog shows the
 * variables first and keeps the loading notes and usage example behind a
 * disclosure; copy and download still use the complete buildCss() file.
 */
export interface CssSections {
  summary: string
  /** The :root block. */
  variables: string
  /** The small-screen rule, exactly as in the file, when it is on. */
  smallScreen: string | null
  /** What the small-screen rule needs to work, in one sentence. */
  smallScreenSetup: string | null
  loading: string
  usage: string
}

export function buildCssSections(settings: Settings): CssSections {
  const tokens = buildTokens(settings.typography)
  const t = settings.typography
  const named = ratioName(t.ratio)
  const small = tokens.smallScreen
  return {
    summary: [
      `${tokens.font.name} (${rangeLabel(tokens.font)})`,
      `${trimNumber(t.baseSize, 2)}px base × ${trimNumber(t.ratio, 3)}${named ? ` ${named}` : ''}`,
      ...(small ? [`headings × ${trimNumber(small.ratio, 3)} below ${small.breakpoint}px`] : []),
      `body line height ${trimNumber(t.lineHeight, 3)}`,
      `body ${weightLabel(tokens.weightBody)}, headings ${weightLabel(tokens.weightHeading)}`,
    ].join(' · '),
    variables: buildRootBlock(tokens),
    smallScreen: small ? smallScreenCss(tokens) : null,
    smallScreenSetup: small
      ? `Small-screen sizes follow the width of an element with class="${SCOPE_CLASS}", as in the preview. Wrap your content in it. The file explains how to follow the browser window instead.`
      : null,
    loading: commentBlock(['Load the font', '', ...loadingGuideLines(tokens)]),
    usage: usageExample(),
  }
}

export function buildCss(settings: Settings): string {
  const tokens = buildTokens(settings.typography)
  const small = tokens.smallScreen
  return [
    commentBlock(headerLines(settings, tokens)),
    '',
    commentBlock(['1. Load the font', '', ...loadingGuideLines(tokens)]),
    '',
    '/* 2. Tokens */',
    buildRootBlock(tokens),
    '',
    ...(small ? [commentBlock(['3. Small screens', '', ...smallScreenNotes(tokens)]), smallScreenCss(tokens), ''] : []),
    `/* ${small ? 4 : 3}. Example: apply the tokens to body text and headings */`,
    usageExample(),
    '',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// JSON, following the Design Tokens Community Group format (2025.10):
// tokens carry $type and $value; dimensions are { value, unit } objects.

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

function dimension(value: number, unit: 'rem' | 'px'): JsonValue {
  return { value: Number(trimNumber(value, 4)), unit }
}

export function buildJsonTokens(settings: Settings): Record<string, JsonValue> {
  const tokens = buildTokens(settings.typography)
  const { font } = tokens
  const t = settings.typography

  const size: Record<string, JsonValue> = {}
  const lineHeight: Record<string, JsonValue> = {}
  const typography: Record<string, JsonValue> = {}

  const weightRef = (role: TypeRole) => (isHeadingRole(role) ? '{font.weight.heading}' : '{font.weight.body}')
  for (const role of ROLE_ORDER) {
    const step = tokens.scale.find((s) => s.role === role)
    if (!step) continue
    size[role] = {
      $type: 'dimension',
      $value: dimension(step.px / ROOT_FONT_SIZE, 'rem'),
      $description: `${ROLE_LABELS[role]}: ${formatPx(step.px, 3)} (base × ratio^${step.step})`,
    }
    lineHeight[role] = { $type: 'number', $value: Number(trimNumber(step.lineHeight, 3)) }
    typography[role] = {
      $type: 'typography',
      $value: {
        fontFamily: '{font.family.text}',
        fontSize: `{font.size.${role}}`,
        fontWeight: weightRef(role),
        letterSpacing: { value: 0, unit: 'px' },
        lineHeight: `{font.lineHeight.${role}}`,
      },
    }
  }

  // Small screens: heading sizes only, and the breakpoint they apply below.
  const small = tokens.smallScreen
  const smallSize: Record<string, JsonValue> = {}
  const smallTypography: Record<string, JsonValue> = {}
  if (small) {
    smallSize.$description = `Heading sizes below ${small.breakpoint}px of container width (see breakpoint.smallScreen). Body and caption sizes do not change.`
    for (const role of HEADING_ROLES) {
      const step = small.scale.find((s) => s.role === role)
      if (!step) continue
      smallSize[role] = {
        $type: 'dimension',
        $value: dimension(step.px / ROOT_FONT_SIZE, 'rem'),
        $description: `${ROLE_LABELS[role]} below ${small.breakpoint}px: ${formatPx(step.px, 3)} (base × ${trimNumber(small.ratio, 3)}^${step.step})`,
      }
      smallTypography[role] = {
        $type: 'typography',
        $value: {
          fontFamily: '{font.family.text}',
          fontSize: `{font.size.smallScreen.${role}}`,
          fontWeight: '{font.weight.heading}',
          letterSpacing: { value: 0, unit: 'px' },
          lineHeight: `{font.lineHeight.${role}}`,
        },
      }
    }
    size.smallScreen = smallSize
    typography.smallScreen = { $description: smallSize.$description, ...smallTypography }
  }

  return {
    $description: `${settings.systemName}: typography tokens generated with Type Bench. Sizes in rem assume a ${ROOT_FONT_SIZE}px root font size.`,
    font: {
      family: {
        text: {
          $type: 'fontFamily',
          $value: [font.name, ...FALLBACK_STACKS[font.category].map((f) => f.replace(/"/g, ''))],
          $description: `${font.name} must be loaded separately (self-hosted @font-face, ${font.fontsourcePackage}, or Google Fonts). ${FONT_LICENSE}.`,
        },
      },
      weight: {
        body: { $type: 'fontWeight', $value: tokens.weightBody, $description: 'Body and supporting text.' },
        heading: { $type: 'fontWeight', $value: tokens.weightHeading, $description: 'Display, H1, H2 and H3.' },
        strong: {
          $type: 'fontWeight',
          $value: tokens.weightStrong,
          $description: 'Emphasis: labels, buttons and table headers (two steps above the body weight).',
        },
      },
      size,
      lineHeight,
    },
    ...(small
      ? {
          breakpoint: {
            smallScreen: {
              $type: 'dimension',
              $value: { value: small.breakpoint, unit: 'px' },
              $description: `Container width below which font.size.smallScreen applies. Type Bench measures the element with class "${SCOPE_CLASS}", not the browser window.`,
            },
          },
        }
      : {}),
    typography,
    $extensions: {
      'type-bench': {
        formatVersion: EXPORT_FORMAT_VERSION,
        rootFontSize: ROOT_FONT_SIZE,
        settings: {
          font: font.name,
          baseSize: t.baseSize,
          ratio: t.ratio,
          bodyLineHeight: t.lineHeight,
          bodyWeight: tokens.weightBody,
          headingWeight: tokens.weightHeading,
          smallScreen: small
            ? { enabled: true, headingRatio: small.ratio, breakpoint: small.breakpoint, measures: `container width (.${SCOPE_CLASS})` }
            : { enabled: false },
        },
        font: {
          name: font.name,
          category: font.category,
          weightAxis: [font.weightRange[0], font.weightRange[1]],
          files: font.source.kind,
          license: FONT_LICENSE,
          copyright: font.copyright,
          fontsourcePackage: font.fontsourcePackage,
          fontsourceFamilyName: font.fontsourceFamilyName,
          googleFontsCss: googleFontsCssUrl(tokens),
        },
      },
    },
  }
}

export function buildJson(settings: Settings): string {
  return `${JSON.stringify(buildJsonTokens(settings), null, 2)}\n`
}

export function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return slug || 'type-system'
}

export function exportFileNames(systemName: string): { css: string; json: string } {
  const slug = slugify(systemName)
  return { css: `${slug}.type-tokens.css`, json: `${slug}.type-tokens.json` }
}
