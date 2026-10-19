import { formatPx, toRem, trimNumber, type TypeTokens } from '../model/tokens.ts'
import { WEIGHT_NAMES, weightRangeLabel } from '../model/fonts.ts'
import { isHeadingRole } from '../model/typeScale.ts'
import { useHelp } from './controls/Help.tsx'

const SUPERSCRIPTS: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶' }

function exponent(step: number): string {
  return String(step)
    .split('')
    .map((c) => SUPERSCRIPTS[c] ?? c)
    .join('')
}

function weightPhrase(weight: number): string {
  return WEIGHT_NAMES[weight] ? `${weight} ${WEIGHT_NAMES[weight]}` : String(weight)
}

export function ScaleList({ tokens, smallScreenActive }: { tokens: TypeTokens; smallScreenActive: boolean }) {
  const help = useHelp('Type scale')
  const small = tokens.smallScreen
  const smallPx = new Map(small?.scale.map((s) => [s.role, s.px]))
  // With small screens on, the two px columns replace rem; the one the preview uses is marked.
  const activeLabel = <span className="sr-only"> (preview now)</span>
  return (
    <section className="scale" aria-labelledby="scale-title">
      <div className="panel-subhead">
        <h3 id="scale-title" className="panel-subtitle">
          Type scale
        </h3>
        {help.button}
        <span className="panel-meta">{small ? 'px by preview width' : <>base × ratio<sup>n</sup></>}</span>
      </div>
      {help.panel(
        <>
          <p>
            Each size is the base × the ratio raised to the step shown (r⁶ for Display, r⁻¹ for Caption), kept at full
            precision and rounded here. rem values assume a 16px root.
          </p>
          {small && (
            <p>
              Below {small.breakpoint} px of preview width, Display to H3 use the {trimNumber(small.ratio, 3)} ratio. Body
              and Caption are the same in both columns. The export includes rem values for both.
            </p>
          )}
          <p>
            Body and caption follow the body line height; headings use the fixed, tighter values in the LH column. Body
            and caption use weight {weightPhrase(tokens.weightBody)}; Display to H3 use {weightPhrase(tokens.weightHeading)}.
            Labels, buttons and table headers use {weightPhrase(tokens.weightStrong)} for emphasis, two steps above the body
            weight. {tokens.font.name} offers weights {weightRangeLabel(tokens.font)}.
          </p>
        </>,
      )}
      <table className="scale-table">
        <caption className="sr-only">
          {small
            ? `Generated sizes in pixels at ${small.breakpoint} px and wider, and below ${small.breakpoint} px, with line height`
            : 'Generated sizes: pixels, rem at a 16px root, and line height'}
        </caption>
        <thead>
          <tr>
            <th scope="col">Role</th>
            {small ? (
              <>
                <th scope="col" className={smallScreenActive ? undefined : 'is-active'}>
                  ≥ {small.breakpoint}
                  {!smallScreenActive && activeLabel}
                </th>
                <th scope="col" className={smallScreenActive ? 'is-active' : undefined}>
                  &lt; {small.breakpoint}
                  {smallScreenActive && activeLabel}
                </th>
              </>
            ) : (
              <>
                <th scope="col">px</th>
                <th scope="col">rem</th>
              </>
            )}
            <th scope="col">
              <abbr title="Line height">LH</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          {tokens.scale.map((step) => (
            <tr key={step.role}>
              <th scope="row">
                {step.label}
                <span className="scale-table__step" aria-label={`ratio to the power ${step.step}`}>
                  r{exponent(step.step)}
                </span>
              </th>
              <td>{formatPx(step.px).replace('px', '')}</td>
              {small ? (
                <td className={isHeadingRole(step.role) ? undefined : 'is-same'}>
                  {formatPx(smallPx.get(step.role) ?? step.px).replace('px', '')}
                </td>
              ) : (
                <td>{toRem(step.px).replace('rem', '')}</td>
              )}
              <td>{trimNumber(step.lineHeight, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
