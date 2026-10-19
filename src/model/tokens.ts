import { fontStack, getFont, nearestSupportedWeight, strongWeightFor, supportedWeights, type FontFamily } from './fonts.ts'
import type { Typography } from './settings.ts'
import { computeScale, HEADING_ROLES, type ScaleStep, type TypeRole } from './typeScale.ts'

/** Every rem value assumes the browser's default 16px root font size. */
export const ROOT_FONT_SIZE = 16

/**
 * The single source of truth for what the preview renders, what the panels
 * display and what the exports contain. The preview applies
 * `cssVariables(tokens)` to the specimen root and injects
 * `smallScreenCss(tokens)`; the CSS export prints the same two, so they
 * cannot drift.
 */
export interface TypeTokens {
  font: FontFamily
  fontFamily: string
  weightBody: number
  weightHeading: number
  /** Emphasis for labels, buttons and table headers, derived from the body weight. */
  weightStrong: number
  supportedWeights: number[]
  /** The scale at the breakpoint and wider (or at every width when small screens are off). */
  scale: ScaleStep[]
  /** Heading sizes below the breakpoint, when the small-screen setting is on. */
  smallScreen: { ratio: number; breakpoint: number; scale: ScaleStep[] } | null
}

/** The small-screen heading ratio in effect: the scale ratio until one has been configured. */
export function smallScreenRatio(t: Pick<Typography, 'ratio' | 'smallScreen'>): number {
  return t.smallScreen.ratio ?? t.ratio
}

export function buildTokens(t: Typography): TypeTokens {
  const font = getFont(t.fontId)
  // State is already validated, but snapping here guarantees that neither the
  // preview nor an export can ever ask for a weight the family lacks.
  const weightBody = nearestSupportedWeight(font, t.bodyWeight)
  return {
    font,
    fontFamily: fontStack(font),
    weightBody,
    weightHeading: nearestSupportedWeight(font, t.headingWeight),
    weightStrong: strongWeightFor(font, weightBody),
    supportedWeights: supportedWeights(font),
    scale: computeScale(t),
    smallScreen: t.smallScreen.enabled
      ? { ratio: smallScreenRatio(t), breakpoint: t.smallScreen.breakpoint, scale: computeScale(t, smallScreenRatio(t)) }
      : null,
  }
}

/** Trims a number to at most `digits` decimals without trailing zeros. */
export function trimNumber(value: number, digits: number): string {
  const fixed = value.toFixed(digits)
  return fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed
}

export function toRem(px: number): string {
  return `${trimNumber(px / ROOT_FONT_SIZE, 4)}rem`
}

export function formatPx(px: number, digits = 2): string {
  return `${trimNumber(px, digits)}px`
}

export function sizeVar(role: TypeRole): string {
  return `--font-size-${role}`
}

export function lineHeightVar(role: TypeRole): string {
  return `--line-height-${role}`
}

export const FAMILY_VAR = '--font-family-text'
export const WEIGHT_BODY_VAR = '--font-weight-body'
export const WEIGHT_HEADING_VAR = '--font-weight-heading'
export const WEIGHT_STRONG_VAR = '--font-weight-strong'

/** Class and container name shared by the preview specimen and the exported setup. */
export const SCOPE_CLASS = 'type-scope'

export function cssVariables(tokens: TypeTokens): Record<string, string> {
  const vars: Record<string, string> = {
    [FAMILY_VAR]: tokens.fontFamily,
    [WEIGHT_BODY_VAR]: String(tokens.weightBody),
    [WEIGHT_HEADING_VAR]: String(tokens.weightHeading),
    [WEIGHT_STRONG_VAR]: String(tokens.weightStrong),
  }
  for (const step of tokens.scale) vars[sizeVar(step.role)] = toRem(step.px)
  for (const step of tokens.scale) vars[lineHeightVar(step.role)] = trimNumber(step.lineHeight, 3)
  return vars
}

/** The heading sizes that change below the breakpoint; empty when the setting is off. */
export function smallScreenVariables(tokens: TypeTokens): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const step of tokens.smallScreen?.scale ?? []) {
    if (HEADING_ROLES.includes(step.role)) vars[sizeVar(step.role)] = toRem(step.px)
  }
  return vars
}

/**
 * The small-screen rule, used verbatim by the preview and the CSS export.
 * A container query follows the width of the element marked `.type-scope`
 * (in the preview, the specimen), not the browser window. Custom properties
 * are redefined on the container's children because a container cannot
 * query its own size; everything inside inherits them.
 */
export function smallScreenCss(tokens: TypeTokens, { pxComments = true } = {}): string {
  if (!tokens.smallScreen) return ''
  const vars = smallScreenVariables(tokens)
  const pxByRole = new Map(tokens.smallScreen.scale.map((s) => [s.role, s.px]))
  return [
    `.${SCOPE_CLASS} {`,
    `  container: ${SCOPE_CLASS} / inline-size;`,
    '}',
    '',
    `@container ${SCOPE_CLASS} (width < ${tokens.smallScreen.breakpoint}px) {`,
    `  .${SCOPE_CLASS} > * {`,
    ...HEADING_ROLES.map(
      (role) =>
        `    ${sizeVar(role)}: ${vars[sizeVar(role)]};${pxComments ? ` /* ${formatPx(pxByRole.get(role) ?? 0)} */` : ''}`,
    ),
    '  }',
    '}',
  ].join('\n')
}

export function stepFor(tokens: TypeTokens, role: TypeRole): ScaleStep {
  const step = tokens.scale.find((s) => s.role === role)
  if (!step) throw new Error(`Missing scale step: ${role}`)
  return step
}
