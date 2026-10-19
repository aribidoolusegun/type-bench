import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { ExportDialog, type ExportFormat } from './components/ExportDialog.tsx'
import { Footer } from './components/Footer.tsx'
import { Header } from './components/Header.tsx'
import { PreviewArea } from './components/preview/PreviewArea.tsx'
import { StressPanel } from './components/StressPanel.tsx'
import { Toast } from './components/Toast.tsx'
import { TypeSystemPanel } from './components/TypeSystemPanel.tsx'
import type { OverflowItem } from './diagnostics/measure.ts'
import { revealInPreview } from './diagnostics/reveal.ts'
import { useDiagnostics } from './diagnostics/useDiagnostics.ts'
import type { Highlight } from './components/preview/HighlightOverlay.tsx'
import { retryFamily } from './fonts/fontLoader.ts'
import { useFontFamily } from './fonts/useFontStatus.ts'
import { useFontSelection } from './fonts/useFontSelection.ts'
import type { FontId } from './model/fonts.ts'
import { buildCss, buildCssSections, buildJson, buildRootBlock, exportFileNames, requiredWeights } from './model/exportTokens.ts'
import type { RestoreResult } from './model/persistence.ts'
import { createDefaultSettings, defaultWidthsFor, normaliseSystemName, PREVIEW_TABS, type Settings } from './model/settings.ts'
import { buildTokens } from './model/tokens.ts'
import { settingsReducer } from './state/settingsReducer.ts'
import { useActiveSection } from './state/useActiveSection.ts'
import { useAnnouncer } from './state/useAnnouncer.ts'
import { usePersistence } from './state/usePersistence.ts'
import { copyText } from './utils/clipboard.ts'
import { downloadText } from './utils/download.ts'
import { canvasAreaWidth } from './utils/layout.ts'

interface AppProps {
  initial: RestoreResult
  storage: Storage | null
}

const SECTIONS = [
  { id: 'preview', label: 'Preview' },
  { id: 'type-system', label: 'Type system' },
  { id: 'stress-test', label: 'Stress test' },
] as const
const SECTION_IDS = SECTIONS.map((s) => s.id)

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

export function App({ initial, storage }: AppProps) {
  const [settings, dispatch] = useReducer(settingsReducer, initial.settings)
  const tokens = useMemo(() => buildTokens(settings.typography), [settings.typography])
  const weights = useMemo(() => requiredWeights(tokens), [tokens])
  const fontStatus = useFontFamily(settings.typography.fontId, weights)
  const saveState = usePersistence(settings, storage, initial)
  const { message, announce, dismiss } = useAnnouncer()
  const [activeSection, setActiveSection] = useActiveSection(SECTION_IDS, '.section-nav')
  const commitFont = useCallback((fontId: FontId) => dispatch({ type: 'setFont', fontId }), [])
  const fontSelection = useFontSelection(settings.typography, commitFont)

  const [dragging, setDragging] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [manualCopy, setManualCopy] = useState<ExportFormat | null>(null)
  const exportOpener = useRef<HTMLElement | null>(null)

  function openExport(opener: HTMLElement | null, manual: ExportFormat | null = null) {
    exportOpener.current = opener
    setManualCopy(manual)
    setExportOpen(true)
  }
  const specimenRef = useRef<HTMLDivElement>(null)

  // Width is left out on purpose: the ResizeObserver inside useDiagnostics
  // already sees every width change, including ones made by dragging.
  const layoutKey = JSON.stringify([settings.typography, settings.stress, settings.preview.tab])
  const diagnostics = useDiagnostics(specimenRef, layoutKey, fontStatus, dragging)

  // Revealing a diagnostic outlines its element in the preview. Any change
  // that triggers a re-measure (font, width, content, tab) clears it, so a
  // highlight can never point at geometry that no longer exists.
  const [highlight, setHighlight] = useState<Highlight | null>(null)
  const highlightCount = useRef(0)
  const clearHighlight = useCallback(() => setHighlight(null), [])
  useEffect(() => {
    if (diagnostics.kind !== 'ready') setHighlight(null)
  }, [diagnostics.kind])

  function revealFinding(item: OverflowItem) {
    const scroller = document.getElementById('preview-panel')
    if (!item.element.isConnected || !scroller) return
    revealInPreview(item.element, scroller)
    highlightCount.current += 1
    setHighlight({ id: highlightCount.current, element: item.element, excess: item.excess })
  }

  // Exports use the cleaned-up name even while the name field is mid-edit.
  const exportSettings: Settings = useMemo(
    () => ({ ...settings, systemName: normaliseSystemName(settings.systemName) }),
    [settings],
  )
  const css = useMemo(() => buildCss(exportSettings), [exportSettings])
  const json = useMemo(() => buildJson(exportSettings), [exportSettings])
  const cssSections = useMemo(() => buildCssSections(exportSettings), [exportSettings])
  const rootBlock = useMemo(() => buildRootBlock(tokens, { pxComments: false }), [tokens])
  const fileNames = exportFileNames(exportSettings.systemName)

  // Report problems with restored settings once, on start-up.
  useEffect(() => {
    if (initial.status === 'repaired') announce('Some saved settings were invalid and have been corrected.', 'neutral')
    if (initial.status === 'discarded') announce('Saved settings couldn’t be used, so defaults were loaded.', 'neutral')
  }, [initial.status, announce])

  useEffect(() => {
    if (saveState.kind === 'error') announce(`Settings not saved: ${saveState.reason}`, 'error')
  }, [saveState, announce])

  // 1, 2 and 3 switch preview tabs whenever focus is not in a text field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target) || exportOpen) return
      const tab = PREVIEW_TABS[Number(event.key) - 1]
      if (tab && /^[1-3]$/.test(event.key)) {
        event.preventDefault()
        dispatch({ type: 'setTab', tab })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [exportOpen])

  const retryFont = useCallback(() => {
    void retryFamily(settings.typography.fontId, weights)
  }, [settings.typography.fontId, weights])

  function reset(opener: HTMLElement | null = null) {
    const previous = settings
    fontSelection.cancel()
    dispatch({ type: 'reset', widths: defaultWidthsFor(canvasAreaWidth()) })
    announce('Typography, preview and stress tests reset to defaults.', 'neutral', {
      label: 'Undo',
      run: () => dispatch({ type: 'replace', settings: previous }),
      returnFocus: opener,
    })
  }

  async function copy(format: ExportFormat): Promise<boolean> {
    const ok = await copyText(format === 'css' ? css : json)
    if (ok) announce(format === 'css' ? 'CSS copied to the clipboard.' : 'JSON tokens copied to the clipboard.', 'success')
    return ok
  }

  async function copyFromSidebar(): Promise<boolean> {
    const ok = await copy('css')
    if (!ok) openExport(document.querySelector<HTMLElement>('.css-preview .copy-button'), 'css')
    return ok
  }

  function download(format: ExportFormat): boolean {
    const name = format === 'css' ? fileNames.css : fileNames.json
    const ok = downloadText(name, format === 'css' ? css : json, format === 'css' ? 'text/css' : 'application/json')
    announce(ok ? `Downloaded ${name}.` : `Couldn’t download ${name}.`, ok ? 'success' : 'error')
    return ok
  }

  const tab = settings.preview.tab
  const width = settings.preview.widths[tab]

  return (
    <div className="app">
      <a className="skip-link" href="#preview">
        Skip to preview
      </a>
      <Header
        systemName={settings.systemName}
        onNameChange={(name) => dispatch({ type: 'setSystemName', name })}
        onReset={reset}
        onExport={(opener) => openExport(opener)}
      />

      <nav className="section-nav" aria-label="Sections">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={activeSection === section.id ? 'location' : undefined}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </a>
        ))}
      </nav>

      {/* The preview comes first in the source so keyboard order matches the
          stacked phone layout and the section bar. The grid still places the
          Type system column on the left on wide screens. */}
      <main id="preview" className="workspace" aria-labelledby="preview-title" tabIndex={-1}>
        <PreviewArea
          settings={settings}
          tokens={tokens}
          fontStatus={fontStatus}
          specimenRef={specimenRef}
          onTabChange={(t) => dispatch({ type: 'setTab', tab: t })}
          onWidthChange={(w) => dispatch({ type: 'setWidth', width: w })}
          onDraggingChange={setDragging}
          onRetryFont={retryFont}
          onClearStress={() => dispatch({ type: 'setStress', patch: createDefaultSettings().stress })}
          highlight={highlight}
          onHighlightDone={clearHighlight}
        />
      </main>

      <aside id="type-system" className="panel panel--left" aria-labelledby="type-system-title">
        <TypeSystemPanel
          typography={settings.typography}
          tokens={tokens}
          fontStatus={fontStatus}
          pendingFontId={fontSelection.pendingId}
          failedFontId={fontSelection.failedId}
          onChooseFont={fontSelection.choose}
          onChange={(patch) => dispatch({ type: 'setTypography', patch })}
          onRetryFont={retryFont}
        />
      </aside>

      <aside id="stress-test" className="panel panel--right" aria-labelledby="stress-title">
        <StressPanel
          stress={settings.stress}
          tab={tab}
          width={width}
          diagnostics={diagnostics}
          fontName={tokens.font.name}
          rootBlock={rootBlock}
          onWidthChange={(w) => dispatch({ type: 'setWidth', width: w })}
          onStressChange={(patch) => dispatch({ type: 'setStress', patch })}
          onShowDashboard={() => dispatch({ type: 'setTab', tab: 'dashboard' })}
          onCopyCss={copyFromSidebar}
          onOpenExport={(opener) => openExport(opener)}
          onRevealFinding={revealFinding}
          onClearHighlight={clearHighlight}
        />
      </aside>

      <Footer saveState={saveState} font={tokens.font} />

      <ExportDialog
        open={exportOpen}
        systemName={exportSettings.systemName}
        css={css}
        json={json}
        sections={cssSections}
        fileNames={fileNames}
        manualCopy={manualCopy}
        openerRef={exportOpener}
        onClose={() => setExportOpen(false)}
        onCopy={copy}
        onDownload={download}
      />
      <Toast message={message} onDismiss={dismiss} />
    </div>
  )
}
