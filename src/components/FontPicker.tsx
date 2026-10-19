import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { familyStatus, loadFamily, type LoadStatus } from '../fonts/fontLoader.ts'
import { useFontRevision } from '../fonts/useFontStatus.ts'
import {
  CATEGORY_LABELS,
  FONTS,
  fontStack,
  getFont,
  nearestSupportedWeight,
  weightRangeLabel,
  type FontCategory,
  type FontFamily,
  type FontId,
} from '../model/fonts.ts'
import { usePresence } from '../motion/motion.ts'
import { Alert, Check, ChevronDown, Search } from './Icons.tsx'

interface FontPickerProps {
  /** The committed family: the one the specimen is set in. */
  value: FontId
  status: LoadStatus
  /** A family that is loading and will be committed once it has loaded. */
  pendingId: FontId | null
  /** A family that was chosen but failed to load, so it was never committed. */
  failedId: FontId | null
  onChoose: (id: FontId) => void
  onRetry: () => void
}

const CATEGORIES: readonly FontCategory[] = ['sans-serif', 'serif']

/** Fonts whose name or category contains the query, in catalogue order. */
export function matchFonts(query: string): FontFamily[] {
  const q = query.trim().toLowerCase()
  return FONTS.filter((f) => !q || f.name.toLowerCase().includes(q) || CATEGORY_LABELS[f.category].toLowerCase().includes(q))
}

function previewWeight(font: FontFamily): number {
  return nearestSupportedWeight(font, 400)
}

/**
 * A searchable font list. Each family's name is drawn in its own face once
 * that face has loaded; until then it uses the interface font, so nothing
 * pretends to be a font that isn't there yet.
 */
export function FontPicker({ value, status, pendingId, failedId, onChoose, onRetry }: FontPickerProps) {
  useFontRevision()
  const id = useId()
  const [open, setOpen] = useState(false)
  const [openCount, setOpenCount] = useState(0)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState<FontId | null>(null)
  const [pointerHighlight, setPointerHighlight] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const presence = usePresence(open)
  const selected = getFont(value)

  const groups = useMemo(() => {
    const matches = matchFonts(query)
    return CATEGORIES.map((category) => ({ category, fonts: matches.filter((f) => f.category === category) })).filter(
      (g) => g.fonts.length > 0,
    )
  }, [query])
  const flat = groups.flatMap((g) => g.fonts)
  // Derived on every render so the highlight can never point at an option the
  // search has just filtered out.
  const activeId = flat.some((f) => f.id === highlighted) ? highlighted : (flat[0]?.id ?? null)

  const optionId = (fontId: FontId) => `${id}-option-${fontId}`
  const listId = `${id}-list`

  function openPicker() {
    setQuery('')
    setHighlighted(pendingId ?? value)
    setPointerHighlight(false)
    setOpenCount((n) => n + 1)
    setOpen(true)
    // Light previews: each family's regular face, fetched only once the list is opened.
    for (const font of FONTS) void loadFamily(font.id, [previewWeight(font)])
  }

  function close(returnFocus: boolean) {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  function choose(fontId: FontId) {
    onChoose(fontId)
    close(true)
  }

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (!popoverRef.current?.contains(target) && !triggerRef.current?.contains(target)) close(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (open && activeId && !pointerHighlight) document.getElementById(optionId(activeId))?.scrollIntoView({ block: 'nearest' })
  })

  function move(next: FontFamily | undefined) {
    if (!next) return
    setPointerHighlight(false)
    setHighlighted(next.id)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const index = activeId ? flat.findIndex((f) => f.id === activeId) : -1
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      move(flat[Math.min(flat.length - 1, index + 1)])
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      move(flat[Math.max(0, index - 1)])
    } else if (event.key === 'PageDown' || event.key === 'PageUp') {
      event.preventDefault()
      move(event.key === 'PageDown' ? flat[flat.length - 1] : flat[0])
    } else if (event.key === 'Enter') {
      event.preventDefault()
      // Match against the field itself, not the last render: Enter can arrive
      // before the filtered list has re-rendered.
      const fresh = matchFonts(event.currentTarget.value)
      const target = fresh.find((f) => f.id === activeId) ?? fresh[0]
      if (target) choose(target.id)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      close(true)
    } else if (event.key === 'Tab') {
      close(false)
    }
  }

  const pending = pendingId ? getFont(pendingId) : null
  const failed = failedId ? getFont(failedId) : null
  const summary = `${CATEGORY_LABELS[selected.category]} · ${selected.source.kind === 'variable' ? 'Variable' : 'Static'} · ${weightRangeLabel(selected)}`

  let statusTone: 'loading' | 'error' | 'ok' = 'ok'
  let statusText = summary
  if (pending) {
    statusTone = 'loading'
    statusText = `Loading ${pending.name}…`
  } else if (failed) {
    statusTone = 'error'
    statusText = `${failed.name} didn’t load. Still showing ${selected.name}.`
  } else if (status === 'error') {
    statusTone = 'error'
    statusText = `${selected.name} didn’t load. The preview is using a fallback ${selected.category === 'serif' ? 'serif' : 'sans-serif'}.`
  } else if (status !== 'loaded') {
    statusTone = 'loading'
    statusText = `Loading ${selected.name}…`
  }

  return (
    <div className="field font-picker">
      <span id={`${id}-label`} className="field__label">
        Font
      </span>
      <button
        ref={triggerRef}
        type="button"
        className="font-picker__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${id}-popover` : undefined}
        aria-labelledby={`${id}-label ${id}-value`}
        onClick={() => (open ? close(true) : openPicker())}
        onKeyDown={(e) => {
          if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !open) {
            e.preventDefault()
            openPicker()
          }
        }}
      >
        <span id={`${id}-value`} className="font-picker__value">
          {selected.name}
        </span>
        <ChevronDown className="icon font-picker__chevron" />
      </button>
      <p className={`font-picker__status is-${statusTone}`} role="status">
        {statusTone === 'error' && <Alert className="icon icon--inline" />}
        {statusTone === 'loading' && <span className="spinner" aria-hidden="true" />}
        <span>{statusText}</span>
        {failed && (
          <button type="button" className="text-button" onClick={() => onChoose(failed.id)}>
            Retry
          </button>
        )}
        {!failed && !pending && status === 'error' && (
          <button type="button" className="text-button" onClick={onRetry}>
            Retry
          </button>
        )}
      </p>

      {presence.mounted && (
        <div
          key={openCount}
          ref={popoverRef}
          id={`${id}-popover`}
          className="font-picker__popover"
          data-state={presence.closing ? 'closing' : 'open'}
          role="dialog"
          aria-label="Choose a font"
          aria-hidden={presence.closing || undefined}
        >
          <div className="font-picker__search">
            <Search />
            {/* Uncontrolled on purpose: React never writes the field's value, so
                text can't be overwritten by a re-render that happens before the
                input event has been applied (preview fonts re-render this list
                as they load). Enter matches against the field's own value. */}
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-label="Search fonts"
              aria-expanded="true"
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={activeId ? optionId(activeId) : undefined}
              placeholder="Search 12 fonts"
              autoComplete="off"
              spellCheck={false}
              defaultValue=""
              onInput={(e) => setQuery(e.currentTarget.value)}
              onKeyDown={onKeyDown}
            />
          </div>
          <div id={listId} role="listbox" aria-label="Fonts" className="font-picker__list">
            {groups.length === 0 && (
              <p className="font-picker__empty" role="status">
                No fonts match “{query.trim()}”.
              </p>
            )}
            {groups.map((group) => (
              <div key={group.category} role="group" aria-labelledby={`${id}-group-${group.category}`}>
                <div id={`${id}-group-${group.category}`} role="presentation" className="font-picker__group">
                  {CATEGORY_LABELS[group.category]}
                </div>
                {group.fonts.map((font) => {
                  const weight = previewWeight(font)
                  const fontStatus = familyStatus(font.id, [weight])
                  const isSelected = font.id === value
                  const isPending = font.id === pendingId
                  return (
                    <div
                      key={font.id}
                      id={optionId(font.id)}
                      role="option"
                      aria-selected={isSelected}
                      className={`font-option${font.id === activeId ? ' is-active' : ''}${isSelected ? ' is-selected' : ''}`}
                      onPointerDown={(e) => e.preventDefault()}
                      onPointerMove={() => {
                        setPointerHighlight(true)
                        setHighlighted(font.id)
                      }}
                      onClick={() => choose(font.id)}
                    >
                      <span
                        className={`font-option__name${fontStatus === 'loaded' ? ' is-loaded' : ''}`}
                        style={fontStatus === 'loaded' ? { fontFamily: fontStack(font), fontWeight: weight } : undefined}
                      >
                        {font.name}
                      </span>
                      <span className="font-option__meta">
                        {fontStatus === 'error' ? 'Unavailable' : fontStatus === 'loaded' ? weightRangeLabel(font) : 'Loading…'}
                      </span>
                      <span className="font-option__check">
                        {isPending ? <span className="spinner" aria-hidden="true" /> : isSelected && <Check />}
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
