import { createDefaultSettings, type Settings, type Typography } from './settings.ts'

/**
 * The stress-test demonstration: a fixed, reproducible setup that produces
 * genuine overflow on the Dashboard. Inter at a 1.54 ratio makes the page
 * heading and the metric figures too large for their boxes at 760px; at the
 * default 1.25 ratio the same layout fits. Nothing is faked: the warning comes
 * from the normal layout checks measuring this layout. Small-screen headings
 * stay off, so the scale ratio is the one thing to adjust.
 */
export const DEMO_TYPOGRAPHY: Readonly<Typography> = {
  fontId: 'inter',
  baseSize: 16,
  ratio: 1.54,
  lineHeight: 1.5,
  bodyWeight: 400,
  headingWeight: 400,
  smallScreen: { enabled: false, ratio: null, breakpoint: 600 },
}
export const DEMO_DASHBOARD_WIDTH = 760

/** The demo setup, keeping the user's system name and their other preview widths. */
export function demoSettings(current: Settings): Settings {
  const defaults = createDefaultSettings(current.systemName)
  return {
    ...defaults,
    typography: { ...DEMO_TYPOGRAPHY, smallScreen: { ...DEMO_TYPOGRAPHY.smallScreen } },
    preview: { tab: 'dashboard', widths: { ...current.preview.widths, dashboard: DEMO_DASHBOARD_WIDTH } },
    stress: defaults.stress,
  }
}

export function demoSummary(): string {
  return `Demo setup: Inter, ${DEMO_TYPOGRAPHY.baseSize} px base, ${DEMO_TYPOGRAPHY.ratio} ratio, Dashboard at ${DEMO_DASHBOARD_WIDTH} px.`
}
