/**
 * Width available to the preview canvas, worked out from the layout's own
 * CSS variables (the sidebar widths change at each breakpoint, and are 0 in
 * the stacked layout). This runs before the first render, so a first visit
 * can open on previews that fit, with no visible jump.
 */
export function canvasAreaWidth(): number {
  const style = getComputedStyle(document.documentElement)
  const read = (name: string) => parseFloat(style.getPropertyValue(name)) || 0
  // 18px covers panel borders and a possible vertical scrollbar in the canvas.
  return window.innerWidth - read('--tb-left-w') - read('--tb-right-w') - 18
}
