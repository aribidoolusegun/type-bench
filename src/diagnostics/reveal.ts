import { prefersReducedMotion } from '../motion/motion.ts'

/**
 * Scrolls the preview so a diagnostic's element is in view. Only the preview
 * scroller moves (plus the page, in the stacked layout, if the preview itself
 * is off-screen); focus stays on the diagnostic that was activated, so the
 * next finding is one key press away.
 */
export function revealInPreview(element: Element, scroller: HTMLElement): void {
  const behavior: ScrollBehavior = prefersReducedMotion() ? 'auto' : 'smooth'
  const box = scroller.getBoundingClientRect()
  const target = element.getBoundingClientRect()
  // Include the overflowing part of the content, not just the element's box.
  const contentWidth = Math.max(target.width, element.scrollWidth)

  const top = scroller.scrollTop + (target.top - box.top) - Math.max(0, (scroller.clientHeight - target.height) / 2)
  const fitsHorizontally = target.left >= box.left && target.left + contentWidth <= box.left + scroller.clientWidth
  const left = fitsHorizontally
    ? scroller.scrollLeft
    : scroller.scrollLeft + (target.left - box.left) - Math.max(0, (scroller.clientWidth - contentWidth) / 2)
  scroller.scrollTo({ top: Math.max(0, top), left: Math.max(0, left), behavior })

  // Stacked layout: the preview may be above or below the viewport.
  if (box.bottom < 0 || box.top > window.innerHeight) scroller.scrollIntoView({ block: 'nearest', behavior })
}
