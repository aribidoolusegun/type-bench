import { normaliseSystemName, SYSTEM_NAME_MAX_LENGTH } from '../model/settings.ts'
import { Download, Reset } from './Icons.tsx'

interface HeaderProps {
  systemName: string
  onNameChange: (name: string) => void
  onReset: (opener: HTMLElement) => void
  /** Receives the button, so focus can return to it when the dialog closes. */
  onExport: (opener: HTMLElement) => void
}

export function Header({ systemName, onNameChange, onReset, onExport }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="wordmark__mark" aria-hidden="true">
          Tb
        </span>
        <h1 className="wordmark">Type Bench</h1>
      </div>
      <div className="app-header__name">
        <label htmlFor="system-name" className="sr-only">
          System name
        </label>
        <input
          id="system-name"
          className="name-input"
          type="text"
          value={systemName}
          maxLength={SYSTEM_NAME_MAX_LENGTH}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={(e) => onNameChange(normaliseSystemName(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
        />
      </div>
      <div className="app-header__actions">
        <button type="button" className="button button--ghost" onClick={(e) => onReset(e.currentTarget)}>
          <Reset /> Reset
        </button>
        <button type="button" className="button button--primary" onClick={(e) => onExport(e.currentTarget)}>
          <Download /> Export
        </button>
      </div>
    </header>
  )
}
