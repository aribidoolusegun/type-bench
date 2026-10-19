import { formatPx, toRem, trimNumber, type TypeTokens } from '../model/tokens.ts'
import { WEIGHT_NAMES, weightRangeLabel } from '../model/fonts.ts'
import { useHelp } from './controls/Help.tsx'

const SUPERSCRIPTS: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶' }

function exponent(step: number): string {
  return String(step)
    .split('')
    .map((c) => SUPERSCRIPTS[c] ?? c)
    .join('')
}

export function ScaleList({ tokens }: { tokens: TypeTokens }) {
  const help = useHelp('Type scale')
  return (
    <section className="scale" aria-labelledby="scale-title">
      <div className="panel-subhead">
        <h3 id="scale-title" className="panel-subtitle">
          Type scale
        </h3>
        {help.button}
        <span className="panel-meta">base × ratio<sup>n</sup></span>
      </div>
      {help.panel(
        <>
          <p>
            Each size is the base × the ratio raised to the step shown (r⁶ for Display, r⁻¹ for Caption), kept at full
            precision and rounded here. rem values assume a 16px root.
          </p>
          <p>
            Body and caption follow the body line height; headings use the fixed, tighter values in the LH column. All
            text uses the chosen weight; labels, buttons and table headers use {tokens.weightStrong}
            {WEIGHT_NAMES[tokens.weightStrong] ? ` ${WEIGHT_NAMES[tokens.weightStrong]}` : ''} for emphasis.{' '}
            {tokens.font.name} offers weights {weightRangeLabel(tokens.font)}.
          </p>
        </>,
      )}
      <table className="scale-table">
        <caption className="sr-only">Generated sizes: pixels, rem at a 16px root, and line height</caption>
        <thead>
          <tr>
            <th scope="col">Role</th>
            <th scope="col">px</th>
            <th scope="col">rem</th>
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
              <td>{toRem(step.px).replace('rem', '')}</td>
              <td>{trimNumber(step.lineHeight, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
