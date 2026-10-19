import type { Typography } from './settings.ts'

export type TypeRole = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'caption'

/** Largest first, the order designers read a scale in. */
export const ROLES: readonly TypeRole[] = ['display', 'h1', 'h2', 'h3', 'body', 'caption']

export const ROLE_LABELS: Record<TypeRole, string> = {
  display: 'Display',
  h1: 'H1',
  h2: 'H2',
  h3: 'H3',
  body: 'Body',
  caption: 'Caption',
}

/** The roles a small-screen ratio applies to. Body and Caption never change. */
export const HEADING_ROLES: readonly TypeRole[] = ['display', 'h1', 'h2', 'h3']

export function isHeadingRole(role: TypeRole): boolean {
  return HEADING_ROLES.includes(role)
}

/** Exponent applied to the ratio: size = base × ratio^step. */
export const ROLE_STEPS: Record<TypeRole, number> = {
  display: 6,
  h1: 5,
  h2: 4,
  h3: 3,
  body: 0,
  caption: -1,
}

/**
 * Headings get fixed, tighter line heights: large text needs less leading
 * than body copy. Body and caption follow the body line-height control.
 */
export const HEADING_LINE_HEIGHTS: Record<'display' | 'h1' | 'h2' | 'h3', number> = {
  display: 1.1,
  h1: 1.15,
  h2: 1.2,
  h3: 1.25,
}

export interface ScaleStep {
  role: TypeRole
  label: string
  step: number
  /** Full precision; round only for display. */
  px: number
  lineHeight: number
}

export function sizeForStep(baseSize: number, ratio: number, step: number): number {
  return baseSize * ratio ** step
}

export function lineHeightFor(role: TypeRole, bodyLineHeight: number): number {
  if (role === 'body' || role === 'caption') return bodyLineHeight
  return HEADING_LINE_HEIGHTS[role]
}

/**
 * The full scale. `headingRatio` replaces the ratio for heading roles only
 * (the small-screen scale); Body and Caption always use `t.ratio`.
 */
export function computeScale(t: Pick<Typography, 'baseSize' | 'ratio' | 'lineHeight'>, headingRatio: number = t.ratio): ScaleStep[] {
  return ROLES.map((role) => ({
    role,
    label: ROLE_LABELS[role],
    step: ROLE_STEPS[role],
    px: sizeForStep(t.baseSize, isHeadingRole(role) ? headingRatio : t.ratio, ROLE_STEPS[role]),
    lineHeight: lineHeightFor(role, t.lineHeight),
  }))
}

/**
 * Whether small-screen heading sizes apply at a container width. Mirrors the
 * exported rule exactly: `@container (width < breakpoint)`, so the breakpoint
 * itself uses the desktop sizes.
 */
export function usesSmallScreen(t: Pick<Typography, 'smallScreen'>, containerWidth: number): boolean {
  return t.smallScreen.enabled && containerWidth < t.smallScreen.breakpoint
}
