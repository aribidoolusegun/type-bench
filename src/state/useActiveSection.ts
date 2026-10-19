import { useEffect, useState } from 'react'

/**
 * Which stacked section is in view, for the sticky section bar on narrow
 * screens: the last section whose top has passed just below the bar. On the
 * three-column layout the bar is hidden and this never changes anything.
 */
export function useActiveSection<T extends string>(ids: readonly T[], navSelector: string): [T, (id: T) => void] {
  const [active, setActive] = useState<T>(ids[0] as T)

  useEffect(() => {
    let frame: number | undefined
    const update = () => {
      frame = undefined
      const nav = document.querySelector(navSelector)
      if (!nav || getComputedStyle(nav).display === 'none') return
      const line = nav.getBoundingClientRect().bottom + 24
      let current = ids[0] as T
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      // At the very bottom of the page the last section is current even if short.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = ids[ids.length - 1] as T
      setActive(current)
    }
    const schedule = () => {
      frame ??= requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame !== undefined) cancelAnimationFrame(frame)
    }
  }, [ids, navSelector])

  return [active, setActive]
}
