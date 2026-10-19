import { useEffect, useState } from 'react'

/**
 * Durations mirror the CSS motion tokens in app.css (--tb-dur-*). Only exit
 * timings are needed in JavaScript: an element has to stay mounted until its
 * exit transition has finished. Nothing here ever delays a user's action.
 */
export const MOTION = {
  exitMs: 140,
  dialogExitMs: 160,
} as const

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

/**
 * Keeps an element mounted while it plays its exit transition.
 * `closing` is true during that window; style it with [data-state='closing'].
 * Reopening during an exit cancels it immediately.
 */
export function usePresence(open: boolean, exitMs: number = MOTION.exitMs): { mounted: boolean; closing: boolean } {
  const [previous, setPrevious] = useState(open)
  const [exiting, setExiting] = useState(false)

  // Adjusting state during render (rather than in an effect) avoids a frame
  // where the element is unmounted before its exit starts.
  if (previous !== open) {
    setPrevious(open)
    setExiting(!open)
  }

  useEffect(() => {
    if (!exiting) return
    const timer = window.setTimeout(() => setExiting(false), prefersReducedMotion() ? 0 : exitMs)
    return () => window.clearTimeout(timer)
  }, [exiting, exitMs])

  return { mounted: open || exiting, closing: !open && exiting }
}
