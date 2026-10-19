import { useEffect, useState, type RefObject } from 'react'

/**
 * The specimen's real rendered width, rather than the setting. This is the
 * width the small-screen container query sees, so anything that reports which
 * sizes apply reads it from here.
 */
export function useRenderedWidth(ref: RefObject<HTMLElement | null>): number | null {
  const [width, setWidth] = useState<number | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.round(entry.borderBoxSize[0]?.inlineSize ?? entry.contentRect.width))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return width
}
