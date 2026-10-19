import { fontStack, getFont, nearestSupportedWeight, strongWeightFor, supportedWeights, type FontFamily } from './fonts.ts'
import type { Typography } from './settings.ts'
import { computeScale, type ScaleStep, type TypeRole } from './typeScale.ts'

/** Every rem value assumes the browser's default 16px root font size. */
export const ROOT_FONT_SIZE = 16

/**
 * The single source of truth for what the preview renders and what the
 * exports contain. The preview applies `cssVariables(tokens)` to the specimen
 * root; the CSS export prints the same map, so the two cannot drift.
 */
export interface TypeTokens {
  font: FontFamily
  fontFamily: string
  weightText: number
  weightStrong: number
  supportedWeights: number[]
  scale: ScaleStep[]
}

export function buildTokens(t: Typography): TypeTokens {
  const font = getFont(t.fontId)
  // State is already validated, but snapping here guarantees that neither the
  // preview nor an export can ever ask for a weight the family lacks.
  const weightText = nearestSupportedWeight(font, t.weight)
  return {
    font,
    fontFamily: fontStack(font),
    weightText,
    weightStrong: strongWeightFor(font, weightText),
    supportedWeights: supportedWeights(font),
    scale: computeScale(t),
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
export const WEIGHT_TEXT_VAR = '--font-weight-text'
export const WEIGHT_STRONG_VAR = '--font-weight-strong'

export function cssVariables(tokens: TypeTokens): Record<string, string> {
  const vars: Record<string, string> = {
    [FAMILY_VAR]: tokens.fontFamily,
    [WEIGHT_TEXT_VAR]: String(tokens.weightText),
    [WEIGHT_STRONG_VAR]: String(tokens.weightStrong),
  }
  for (const step of tokens.scale) vars[sizeVar(step.role)] = toRem(step.px)
  for (const step of tokens.scale) vars[lineHeightVar(step.role)] = trimNumber(step.lineHeight, 3)
  return vars
}

export function stepFor(tokens: TypeTokens, role: TypeRole): ScaleStep {
  const step = tokens.scale.find((s) => s.role === role)
  if (!step) throw new Error(`Missing scale step: ${role}`)
  return step
}
