import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { PREVIEW_LABELS, PREVIEW_TABS, type PreviewTab } from '../../model/settings.ts'

interface PreviewTabsProps {
  tab: PreviewTab
  panelId: string
  onChange: (tab: PreviewTab) => void
}

export function tabId(tab: PreviewTab): string {
  return `preview-tab-${tab}`
}

/**
 * Tabs with roving focus: arrow keys move between them, Home and End jump to
 * the ends. One shared indicator sits behind the active tab and slides when
 * it changes; it is placed from the active button's real geometry.
 */
export function PreviewTabs({ tab, panelId, onChange }: PreviewTabsProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const refs = useRef<Partial<Record<PreviewTab, HTMLButtonElement | null>>>({})
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null)
  // The first placement must not animate in from the left edge.
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const place = () => {
      const button = refs.current[tab]
      if (button) setIndicator({ x: button.offsetLeft, w: button.offsetWidth })
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(list)
    return () => observer.disconnect()
  }, [tab])

  useLayoutEffect(() => {
    if (!indicator || ready) return
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
  }, [indicator, ready])

  function onKeyDown(event: KeyboardEvent) {
    const index = PREVIEW_TABS.indexOf(tab)
    let next: PreviewTab | undefined
    if (event.key === 'ArrowRight') next = PREVIEW_TABS[(index + 1) % PREVIEW_TABS.length]
    else if (event.key === 'ArrowLeft') next = PREVIEW_TABS[(index - 1 + PREVIEW_TABS.length) % PREVIEW_TABS.length]
    else if (event.key === 'Home') next = PREVIEW_TABS[0]
    else if (event.key === 'End') next = PREVIEW_TABS[PREVIEW_TABS.length - 1]
    if (!next) return
    event.preventDefault()
    onChange(next)
    refs.current[next]?.focus()
  }

  return (
    <div ref={listRef} className="tabs" role="tablist" aria-label="Preview type" onKeyDown={onKeyDown}>
      {indicator && (
        <span
          className={`tabs__indicator${ready ? ' is-ready' : ''}`}
          aria-hidden="true"
          style={{ '--x': `${indicator.x}px`, '--w': `${indicator.w}px` } as CSSProperties}
        />
      )}
      {PREVIEW_TABS.map((t) => (
        <button
          key={t}
          ref={(el) => {
            refs.current[t] = el
          }}
          id={tabId(t)}
          type="button"
          role="tab"
          className="tab"
          aria-selected={t === tab}
          aria-controls={panelId}
          tabIndex={t === tab ? 0 : -1}
          onClick={() => onChange(t)}
        >
          {PREVIEW_LABELS[t]}
        </button>
      ))}
    </div>
  )
}
