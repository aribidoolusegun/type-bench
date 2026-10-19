import { FONT_LICENSE, type FontFamily } from '../model/fonts.ts'
import type { SaveState } from '../state/usePersistence.ts'

const time = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })

function saveText(state: SaveState): string {
  switch (state.kind) {
    case 'unavailable':
      return 'Not saving: browser storage is unavailable. Changes last until you close this tab.'
    case 'not-saved':
      return 'Default settings. Changes save in this browser.'
    case 'restored':
      return 'Restored from this browser'
    case 'saving':
      return 'Saving…'
    case 'saved':
      return `Saved in this browser at ${time.format(state.at)}`
    case 'error':
      return `Not saved: ${state.reason}`
    case 'paused':
      return 'Demo running: your saved settings are unchanged.'
  }
}

export function Footer({ saveState, font }: { saveState: SaveState; font: FontFamily }) {
  const tone = saveState.kind === 'error' || saveState.kind === 'unavailable' ? 'is-error' : saveState.kind === 'saved' || saveState.kind === 'restored' ? 'is-ok' : ''
  return (
    <footer className="app-footer">
      <p className={`save-status ${tone}`}>
        <span className="save-status__dot" aria-hidden="true" />
        {saveText(saveState)}
      </p>
      <p className="app-footer__shortcuts">
        <span>
          <kbd>1</kbd>
          <kbd>2</kbd>
          <kbd>3</kbd> Switch preview
        </span>
        <span>
          <kbd>←</kbd>
          <kbd>→</kbd> Resize with a handle focused
        </span>
        <span>
          <kbd>Esc</kbd> Close
        </span>
      </p>
      <p className="app-footer__license">
        {font.name} ·{' '}
        <a href={`${import.meta.env.BASE_URL}fonts/${font.id}/OFL.txt`} target="_blank" rel="noreferrer">
          {FONT_LICENSE}
        </a>
      </p>
    </footer>
  )
}
