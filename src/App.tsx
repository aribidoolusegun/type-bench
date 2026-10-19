import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { ExportDialog, type ExportFormat } from './components/ExportDialog.tsx'
import { Footer } from './components/Footer.tsx'
import { Header } from './components/Header.tsx'
import { Intro, type DemoPhase } from './components/Intro.tsx'
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
import { demoSettings } from './model/demo.ts'
import { getFont, snapWeights, type FontId } from './model/fonts.ts'
import { buildCss, buildCssSections, buildJson, buildRootBlock, exportFileNames, requiredWeights } from './model/exportTokens.ts'
import type { RestoreResult } from './model/persistence.ts'
import { createDefaultSettings, defaultWidthsFor, normaliseSystemName, PREVIEW_TABS, type Settings } from './model/settings.ts'
import { buildTokens, smallScreenCss } from './model/tokens.ts'
import { usesSmallScreen } from './model/typeScale.ts'
import { useRenderedWidth } from './components/preview/useRenderedWidth.ts'
import { settingsReducer } from './state/settingsReducer.ts'
import { useActiveSection } from './state/useActiveSection.ts'
import { useAnnouncer } from './state/useAnnouncer.ts'
import { useIntro } from './state/useIntro.ts'
import { usePersistence } from './state/usePersistence.ts'
import { usePresence } from './motion/motion.ts'
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
  { id: 'stress-test', label: 'Layout testing' },
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
  // The stress-test demonstration. While it runs, saving is paused so the
  // temporary setup can never overwrite saved work; `snapshot` is restorable.
  const [demo, setDemo] = useState<{ snapshot: Settings; phase: DemoPhase; finding: string | null } | null>(null)
  const saveState = usePersistence(settings, storage, initial, demo !== null)
  const intro = useIntro(storage)
  const introPresence = usePresence(intro.open || demo !== null)
  const introHeadingRef = useRef<HTMLHeadingElement>(null)
  const [focusIntro, setFocusIntro] = useState(false)
  const { message, announce, dismiss } = useAnnouncer()
  const [activeSection, setActiveSection] = useActiveSection(SECTION_IDS, '.section-nav')
  // When a font change moves a weight, say so once beside the weights (no toast).
  const [weightNote, setWeightNote] = useState<string | null>(null)
  const typographyRef = useRef(settings.typography)
  typographyRef.current = settings.typography
  const commitFont = useCallback((fontId: FontId) => {
    setWeightNote(snapWeights(getFont(fontId), typographyRef.current).note)
    dispatch({ type: 'setFont', fontId })
  }, [])
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
  // The specimen's own width decides which sizes apply, as in the exported CSS.
  const renderedWidth = useRenderedWidth(specimenRef)
  const smallScreenActive = usesSmallScreen(settings.typography, renderedWidth ?? settings.preview.widths[settings.preview.tab])

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

  // The demonstration only reveals a finding from a fresh measurement of the
  // demo layout (never the result that was on screen before it started), and
  // only one the layout checks actually found.
  const resultBeforeDemo = useRef<unknown>(null)
  const latestResult = diagnostics.kind === 'ready' ? diagnostics.result : null
  useEffect(() => {
    if (!demo || demo.phase !== 'preparing' || !latestResult || latestResult === resultBeforeDemo.current) return
    if (settings.preview.tab !== 'dashboard') return
    const finding = [...latestResult.overflow, ...latestResult.clipped][0]
    if (finding) revealFinding(finding)
    setDemo({ ...demo, phase: finding ? 'shown' : 'none', finding: finding ? `${finding.label}, ${finding.excess} px wider than its box` : null })
    setFocusIntro(true)
  }, [demo, latestResult, settings.preview.tab])

  // Move focus to the intro heading after it changes (demo result, reopening).
  useEffect(() => {
    if (!focusIntro) return
    setFocusIntro(false)
    introHeadingRef.current?.focus({ preventScroll: true })
    introHeadingRef.current?.scrollIntoView({ block: 'nearest' })
  }, [focusIntro])

  function startDemo() {
    fontSelection.cancel()
    resultBeforeDemo.current = latestResult
    setDemo({ snapshot: settings, phase: 'preparing', finding: null })
    dispatch({ type: 'replace', settings: demoSettings(settings) })
    setFocusIntro(true)
  }

  function restoreDemo() {
    if (!demo) return
    dispatch({ type: 'replace', settings: demo.snapshot })
    setDemo(null)
    setFocusIntro(true)
    announce('Your settings are restored.', 'success')
  }

  function keepDemo() {
    if (!demo) return
    const snapshot = demo.snapshot
    setDemo(null)
    intro.dismiss()
    document.querySelector<HTMLElement>('[role=tab][aria-selected=true]')?.focus()
    // Not silent: saying so, with a way back.
    announce('The demo setup is now your configuration and will be saved.', 'neutral', {
      label: 'Undo',
      run: () => dispatch({ type: 'replace', settings: snapshot }),
    })
  }

  function startExploring() {
    intro.dismiss()
    document.querySelector<HTMLElement>('[role=tab][aria-selected=true]')?.focus()
  }

  function openAbout() {
    intro.reopen()
    setFocusIntro(true)
  }

  // What the layout checks report right now, for the demo's live line.
  const liveCheck = demo && latestResult
    ? (() => {
        const n = latestResult.overflow.length + latestResult.clipped.length
        if (latestResult.pastEdge > 0 || n > 0) return `Layout checks: ${n === 1 ? '1 element overflows' : `${n} elements overflow`}${latestResult.pastEdge > 0 ? `, running ${latestResult.pastEdge} px past the edge` : ''}.`
        return 'Layout checks: nothing overflows now.'
      })()
    : null

  // Exports use the cleaned-up name even while the name field is mid-edit.
  const exportSettings: Settings = useMemo(
    () => ({ ...settings, systemName: normaliseSystemName(settings.systemName) }),
    [settings],
  )
  const css = useMemo(() => buildCss(exportSettings), [exportSettings])
  const json = useMemo(() => buildJson(exportSettings), [exportSettings])
  const cssSections = useMemo(() => buildCssSections(exportSettings), [exportSettings])
  const rootBlock = useMemo(
    () => [buildRootBlock(tokens, { pxComments: false }), smallScreenCss(tokens, { pxComments: false })].filter(Boolean).join('\n\n'),
    [tokens],
  )
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
    announce('Typography, preview and layout tests reset to defaults.', 'neutral', {
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
        onAbout={openAbout}
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
        {introPresence.mounted && (
          <Intro
            ref={introHeadingRef}
            demo={demo && { phase: demo.phase, finding: demo.finding }}
            liveCheck={liveCheck}
            resolved={!!latestResult && latestResult.pastEdge === 0 && latestResult.overflow.length + latestResult.clipped.length === 0}
            closing={introPresence.closing}
            onTry={startDemo}
            onExplore={startExploring}
            onRestore={restoreDemo}
            onKeep={keepDemo}
          />
        )}
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
          renderedWidth={renderedWidth}
          smallScreenActive={smallScreenActive}
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
          onChange={(patch) => {
            setWeightNote(null)
            dispatch({ type: 'setTypography', patch })
          }}
          onSmallScreenChange={(patch) => dispatch({ type: 'setSmallScreen', patch })}
          onRetryFont={retryFont}
          smallScreenActive={smallScreenActive}
          weightNote={weightNote}
        />
      </aside>

      <aside id="stress-test" className="panel panel--right" aria-labelledby="stress-title">
        <StressPanel
          stress={settings.stress}
          tab={tab}
          diagnostics={diagnostics}
          fontName={tokens.font.name}
          rootBlock={rootBlock}
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
