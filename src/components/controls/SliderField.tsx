import { useId, useState, type CSSProperties, type ReactNode } from 'react'
import { clamp, parseDecimal } from '../../model/settings.ts'
import { trimNumber } from '../../model/tokens.ts'
import { useHelp } from './Help.tsx'

interface SliderFieldProps {
  label: string
  value: number
  min: number
  max: number
  /** Step for the slider and arrow keys. */
  step: number
  /** Decimals shown in the number field. */
  decimals: number
  unit?: string
  onChange: (value: number) => void
  /** Rendered under the slider (presets, hints). */
  children?: ReactNode
  /** Formats the slider's spoken value, e.g. "400, Regular". */
  valueText?: (value: number) => string
  /** Snap typed values to the step (used for weights). */
  snap?: boolean
  /** Set false for a number field on its own. */
  slider?: boolean
  className?: string
  /** Short secondary text beside the label, e.g. “Regular”. */
  meta?: ReactNode
  /** Secondary explanation behind a “?” disclosure. */
  help?: ReactNode
}

/**
 * A slider and a number field bound to the same value. Typing updates the
 * value live while it is valid; invalid or out-of-range input is explained
 * and corrected when the field is committed (Enter or leaving the field).
 */
export function SliderField({
  label,
  value,
  min,
  max,
  step,
  decimals,
  unit,
  onChange,
  children,
  valueText,
  snap,
  slider = true,
  className,
  meta,
  help,
}: SliderFieldProps) {
  const id = useId()
  const helpDisclosure = useHelp(label)
  const inputId = `${id}-input`
  const labelId = `${id}-label`
  const messageId = `${id}-message`
  const [draft, setDraft] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const range = `${trimNumber(min, decimals)}–${trimNumber(max, decimals)}${unit ? ` ${unit}` : ''}`
  const normalise = (n: number) => {
    const clamped = clamp(n, min, max)
    return snap ? clamp(Math.round(clamped / step) * step, min, max) : clamped
  }

  const parsedDraft = draft === null ? null : parseDecimal(draft)
  const invalid = draft !== null && (parsedDraft === null || parsedDraft < min || parsedDraft > max)

  function handleType(text: string) {
    setDraft(text)
    const parsed = parseDecimal(text)
    if (parsed !== null && parsed >= min && parsed <= max) {
      onChange(normalise(parsed))
      setMessage(null)
    }
  }

  function commit() {
    if (draft === null) return
    const parsed = parseDecimal(draft)
    if (parsed === null) {
      setMessage(draft.trim() === '' ? `Enter a value (${range}). Kept ${trimNumber(value, decimals)}.` : `“${draft}” isn’t a number. Kept ${trimNumber(value, decimals)}.`)
    } else {
      const next = normalise(parsed)
      setMessage(next !== parsed ? `${label} ranges from ${range}. Using ${trimNumber(next, decimals)}.` : null)
      onChange(next)
    }
    setDraft(null)
  }

  function nudge(direction: 1 | -1, large: boolean) {
    const next = normalise(value + direction * step * (large ? 10 : 1))
    onChange(Number(next.toFixed(6)))
    setDraft(null)
    setMessage(null)
  }

  const percent = ((value - min) / (max - min)) * 100

  return (
    <div className={`field${className ? ` ${className}` : ''}`}>
      <div className="field__row">
        <div className="field__heading">
          <label id={labelId} htmlFor={inputId} className="field__label">
            {label}
          </label>
          {meta && <span className="field__meta">{meta}</span>}
          {help && helpDisclosure.button}
        </div>
        <div className={`number-input${invalid ? ' is-invalid' : ''}`}>
          <input
            id={inputId}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            value={draft ?? trimNumber(value, decimals)}
            aria-invalid={invalid || undefined}
            aria-describedby={messageId}
            onChange={(e) => handleType(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              else if (e.key === 'Escape') {
                setDraft(null)
                setMessage(null)
              } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault()
                nudge(e.key === 'ArrowUp' ? 1 : -1, e.shiftKey)
              }
            }}
          />
          <span className="number-input__unit" aria-hidden="true">
            {unit}
          </span>
        </div>
      </div>
      {slider && (
        <input
          type="range"
          className="slider"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-labelledby={labelId}
          aria-valuetext={valueText ? valueText(value) : `${trimNumber(value, decimals)}${unit ? ` ${unit}` : ''}`}
          style={{ '--fill': `${percent}%` } as CSSProperties}
          onChange={(e) => {
            setDraft(null)
            setMessage(null)
            onChange(normalise(Number(e.target.value)))
          }}
        />
      )}
      {children}
      <p id={messageId} className="field__message" role="status">
        {message}
      </p>
      {help && helpDisclosure.panel(help)}
    </div>
  )
}
