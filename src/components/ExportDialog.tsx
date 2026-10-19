import { useEffect, useRef, useState, type RefObject } from 'react'
import { MOTION, prefersReducedMotion } from '../motion/motion.ts'
import { CodeBlock } from './CodeBlock.tsx'
import { CopyButton } from './controls/CopyButton.tsx'
import { ChevronDown, Close, Download } from './Icons.tsx'

export type ExportFormat = 'css' | 'json'

interface ExportDialogProps {
  open: boolean
  systemName: string
  css: string
  json: string
  /** The CSS export split for display: the variables come first. */
  sections: { summary: string; variables: string; loading: string; usage: string }
  fileNames: { css: string; json: string }
  /** Set when copying failed elsewhere, so the dialog opens ready for manual copying. */
  manualCopy: ExportFormat | null
  onClose: () => void
  onCopy: (format: ExportFormat) => Promise<boolean>
  onDownload: (format: ExportFormat) => boolean
  /**
   * The control that opened the dialog. Safari does not focus buttons on
   * click, so document.activeElement cannot be trusted to find it.
   */
  openerRef: RefObject<HTMLElement | null>
}

const LABELS: Record<ExportFormat, string> = { css: 'CSS variables', json: 'JSON tokens' }

export function ExportDialog({
  open,
  systemName,
  css,
  json,
  sections,
  fileNames,
  manualCopy,
  onClose,
  onCopy,
  onDownload,
  openerRef,
}: ExportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [format, setFormat] = useState<ExportFormat>('css')
  const [fallback, setFallback] = useState<ExportFormat | null>(null)
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null)
  const [closing, setClosing] = useState(false)
  const opener = useRef<HTMLElement | null>(null)
  const closeTimer = useRef<number | undefined>(undefined)

  /** Plays the exit transition, then closes. Every way of closing goes through here. */
  function requestClose() {
    const dialog = dialogRef.current
    if (!dialog?.open || closeTimer.current !== undefined) return
    setClosing(true)
    closeTimer.current = window.setTimeout(
      () => {
        closeTimer.current = undefined
        setClosing(false)
        dialog.close()
      },
      prefersReducedMotion() ? 0 : MOTION.dialogExitMs,
    )
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      const active = document.activeElement
      opener.current = openerRef.current ?? (active instanceof HTMLElement && active !== document.body ? active : null)
      const initialFormat = manualCopy ?? format
      if (manualCopy) {
        setFormat(manualCopy)
        setFallback(manualCopy)
      }
      dialog.showModal()
      // Start on the selected format tab, unless the copy fallback needs the text selected.
      if (!manualCopy) document.getElementById(`export-tab-${initialFormat}`)?.focus()
    } else if (!open && dialog.open) {
      requestClose()
    }
  }, [open, manualCopy])

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  useEffect(() => {
    if (fallback && fallback === format) {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }
  }, [fallback, format])

  const text = format === 'css' ? css : json
  const other: ExportFormat = format === 'css' ? 'json' : 'css'

  async function copy(): Promise<boolean> {
    const ok = await onCopy(format)
    setFallback(ok ? null : format)
    setFeedback({
      ok,
      text: ok ? `${format === 'css' ? 'CSS' : 'JSON'} copied to the clipboard.` : 'Copy blocked. Use the selected text instead.',
    })
    return ok
  }

  function download(f: ExportFormat) {
    const ok = onDownload(f)
    const name = f === 'css' ? fileNames.css : fileNames.json
    setFeedback({ ok, text: ok ? `Downloaded ${name}.` : `Couldn’t start the download of ${name}.` })
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      data-state={closing ? 'closing' : 'open'}
      aria-labelledby="export-title"
      aria-describedby="export-desc"
      onCancel={(e) => {
        // Escape: run the same exit transition as the close button.
        e.preventDefault()
        requestClose()
      }}
      onClose={() => {
        setFallback(null)
        setFeedback(null)
        onClose()
        // Return focus to whatever opened the dialog.
        if (opener.current?.isConnected) opener.current.focus()
      }}
      onClick={(e) => {
        // A click on the backdrop lands on the dialog element itself.
        if (e.target === dialogRef.current) requestClose()
      }}
    >
      <div className="dialog__inner">
        <header className="dialog__header">
          <div>
            <h2 id="export-title" className="dialog__title">
              Export
            </h2>
            <p id="export-desc" className="dialog__desc">
              Tokens for “{systemName}”, generated from the same values as the preview.
            </p>
            <p className="dialog__summary">{sections.summary}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close export" onClick={requestClose}>
            <Close />
          </button>
        </header>

        <div className="tabs tabs--small" role="tablist" aria-label="Export format">
          {(['css', 'json'] as const).map((f) => (
            <button
              key={f}
              id={`export-tab-${f}`}
              type="button"
              role="tab"
              className="tab"
              aria-selected={format === f}
              aria-controls="export-panel"
              tabIndex={format === f ? 0 : -1}
              onClick={() => setFormat(f)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault()
                  const next = f === 'css' ? 'json' : 'css'
                  setFormat(next)
                  document.getElementById(`export-tab-${next}`)?.focus()
                }
              }}
            >
              {LABELS[f]}
            </button>
          ))}
        </div>

        <div id="export-panel" role="tabpanel" aria-labelledby={`export-tab-${format}`} className="dialog__panel">
          {fallback === format ? (
            <>
              <p className="dialog__notice" role="alert">
                Your browser blocked clipboard access. The full file is selected below: press ⌘C (or Ctrl+C) to copy it.
              </p>
              <textarea
                ref={textareaRef}
                className="code code--textarea"
                readOnly
                value={text}
                aria-label={`${LABELS[format]} to copy`}
                spellCheck={false}
              />
            </>
          ) : format === 'css' ? (
            <>
              <CodeBlock code={sections.variables} language="css" label="CSS variables" className="code--dialog" />
              <details className="disclosure">
                <summary className="disclosure__summary">
                  <ChevronDown className="icon disclosure__chevron" />
                  Font loading and usage example
                </summary>
                <div className="disclosure__body">
                  <p className="dialog__hint">
                    Both are included as comments in the copied and downloaded file. Naming a font in CSS doesn’t load
                    it, so make the font available first.
                  </p>
                  <CodeBlock code={sections.loading} language="css" label="Font-loading instructions" />
                  <CodeBlock code={sections.usage} language="css" label="Usage example" />
                </div>
              </details>
            </>
          ) : (
            <CodeBlock code={json} language="json" label="JSON tokens" className="code--dialog" />
          )}
        </div>

        <footer className="dialog__footer">
          <div className="dialog__meta">
            <p className="dialog__includes">
              {format === 'css'
                ? 'Copy and download include the full file: these variables, the font-loading notes and the usage example.'
                : 'Design Tokens (DTCG) JSON: family, weights, sizes, line heights and font metadata.'}
            </p>
            <p className="dialog__filename">
              <span className="sr-only">File name: </span>
              {format === 'css' ? fileNames.css : fileNames.json}
            </p>
            <p className={`dialog__feedback${feedback?.ok === false ? ' is-error' : ''}`} role="status">
              {feedback?.text}
            </p>
          </div>
          <div className="dialog__actions">
            {/* The selected tab decides the main actions; the other format stays one click away. */}
            <button type="button" className="button button--ghost" onClick={() => download(other)}>
              <Download /> {other === 'css' ? 'Download CSS' : 'Download JSON'}
            </button>
            <CopyButton key={format} label={`Copy ${format === 'css' ? 'CSS' : 'JSON'}`} onCopy={copy} />
            <button type="button" className="button button--primary" onClick={() => download(format)}>
              <Download /> {format === 'css' ? 'Download CSS' : 'Download JSON'}
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  )
}
