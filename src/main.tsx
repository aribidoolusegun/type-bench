import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { loadFamily } from './fonts/fontLoader.ts'
import { requiredWeights } from './model/exportTokens.ts'
import { getStorage, readStoredSettings } from './model/persistence.ts'
import { defaultWidthsFor } from './model/settings.ts'
import { buildTokens } from './model/tokens.ts'
import { canvasAreaWidth } from './utils/layout.ts'
import './styles/app.css'
import './styles/specimen.css'

const storage = getStorage()
const initial = readStoredSettings(storage)

// A first visit (or one whose saved data couldn't be used) opens on previews
// that fit the screen. Saved widths are always restored exactly as saved.
if (initial.status === 'empty' || initial.status === 'discarded') {
  initial.settings.preview.widths = defaultWidthsFor(canvasAreaWidth())
}

// Start fetching the selected family before React renders, so the specimen
// is ready as early as possible. Only this one family loads at start-up.
const { typography } = initial.settings
void loadFamily(typography.fontId, requiredWeights(buildTokens(typography)))

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

createRoot(root).render(
  <StrictMode>
    <App initial={initial} storage={storage} />
  </StrictMode>,
)
