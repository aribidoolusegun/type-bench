import { useId, type ReactNode } from 'react'
import { useHelp } from './Help.tsx'

interface SwitchProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  /** Extra content beside the label, such as a scope badge. */
  badge?: ReactNode
  /** Secondary explanation behind a “?” disclosure. */
  help?: ReactNode
}

export function Switch({ label, checked, onChange, badge, help }: SwitchProps) {
  const id = useId()
  const helpDisclosure = useHelp(label)
  return (
    <div className="switch-field">
      <div className="switch-field__row">
        {/* Label, badge and help wrap among themselves; the switch stays on the right. */}
        <div className="switch-field__text">
          <span id={`${id}-label`} className="field__label">
            {label}
          </span>
          {help && helpDisclosure.button}
          {badge}
        </div>
        <button
          type="button"
          role="switch"
          className="switch"
          aria-checked={checked}
          aria-labelledby={`${id}-label`}
          onClick={() => onChange(!checked)}
        >
          <span className="switch__thumb" aria-hidden="true" />
        </button>
      </div>
      {help && helpDisclosure.panel(help)}
    </div>
  )
}
