/**
 * Measurements taken from the rendered specimen. Nothing here is estimated
 * from settings alone: every number comes from the browser's own layout.
 *
 * Specimen markup opts in with data attributes:
 *   data-diag-heading="Main heading"  a heading whose line count is reported
 *   data-diag-body                    a body paragraph used for line length
 *   data-diag-label="Metric value"    a readable name for overflow reports
 */

export interface HeadingMeasure {
  label: string
  lines: number
}

export interface OverflowItem {
  label: string
  /** How far the content extends beyond its box, in CSS px. */
  excess: number
  /**
   * The measured element, so a finding can be revealed in the preview. Each
   * measurement creates fresh items, so this never outlives a layout change.
   */
  element: Element
}

export interface BodyMeasure {
  /** Average characters per full line, approximate. */
  charsPerLine: number
  paragraphs: number
}

export interface Diagnostics {
  specimenWidth: number
  /** Pixels of content beyond the specimen's right edge; 0 when everything fits. */
  pastEdge: number
  headings: HeadingMeasure[]
  overflow: OverflowItem[]
  clipped: OverflowItem[]
  scrollRegions: OverflowItem[]
  body: BodyMeasure | null
}

const TOLERANCE = 1

/** Counts rendered line boxes by grouping the text's client rects by vertical position. */
export function countLines(element: Element): number {
  const range = document.createRange()
  range.selectNodeContents(element)
  const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0)
  range.detach()
  if (rects.length === 0) return 0
  const lineTops: number[] = []
  for (const rect of rects.sort((a, b) => a.top - b.top)) {
    const middle = rect.top + rect.height / 2
    const last = lineTops[lineTops.length - 1]
    // A new line starts when this fragment's middle sits below the previous line.
    if (last === undefined || middle - last > rect.height / 2) lineTops.push(middle)
  }
  return lineTops.length
}

function labelFor(element: Element): string {
  const labelled = element.closest('[data-diag-label]')
  const base = labelled?.getAttribute('data-diag-label')
  // Quote text only for leaf elements; a container's text runs blocks together.
  const leaf = element.childElementCount === 0
  const text = leaf ? (element.textContent ?? '').replace(/\s+/g, ' ').trim() : ''
  const snippet = text.length > 32 ? `${text.slice(0, 31)}…` : text
  // A leaf inside a labelled container names both, e.g. Heading row: “Shipments”.
  if (base) return snippet ? `${base}: “${snippet}”` : base
  return snippet ? `“${snippet}”` : `A ${element.tagName.toLowerCase()} element`
}

/** Right edge of an element's content (not its box), in viewport coordinates. */
function contentRight(el: Element): number {
  return el.getBoundingClientRect().left + el.clientLeft + el.scrollWidth
}

/**
 * An overflowing child also inflates every ancestor's scrollWidth, so an
 * ancestor is only reported when its content reaches further than any of
 * its overflowing descendants explain: then it has a cause of its own (a
 * grid track or flex row that grew, for example).
 */
function sources(elements: Element[]): Element[] {
  return elements.filter((el) => {
    const inner = elements.filter((other) => other !== el && el.contains(other))
    if (inner.length === 0) return true
    const explained = Math.max(...inner.map(contentRight))
    return contentRight(el) > explained + TOLERANCE
  })
}

function measureOverflow(root: HTMLElement) {
  const spill: Element[] = []
  const clipped: Element[] = []
  const scroll: Element[] = []
  const all = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]

  for (const el of all) {
    if (el.scrollWidth <= el.clientWidth + TOLERANCE) continue
    const style = getComputedStyle(el)
    if (style.display === 'inline' || style.display === 'contents' || style.display === 'none') continue
    // Visually hidden helpers (1px screen-reader text) are clipped on purpose.
    if (el.clientWidth <= 1) continue
    if (style.overflowX === 'auto' || style.overflowX === 'scroll') scroll.push(el)
    else if (style.overflowX === 'hidden' || style.overflowX === 'clip') clipped.push(el)
    else spill.push(el)
  }

  // Content inside a deliberate scroll region is contained by design.
  const insideScroll = (el: Element) => scroll.some((s) => s !== el && s.contains(el))
  const toItems = (list: Element[]) =>
    sources(list.filter((el) => el !== root && !insideScroll(el))).map((el) => ({
      label: labelFor(el),
      excess: Math.round(el.scrollWidth - el.clientWidth),
      element: el,
    }))

  return {
    // How far anything reaches past the specimen's own right edge.
    pastEdge: Math.max(0, Math.round(root.scrollWidth - root.clientWidth)),
    overflow: toItems(spill),
    clipped: toItems(clipped),
    scrollRegions: toItems(scroll),
  }
}

let canvasContext: CanvasRenderingContext2D | null = null

function measureBody(root: HTMLElement): BodyMeasure | null {
  const paragraphs = Array.from(root.querySelectorAll<HTMLElement>('[data-diag-body]'))
  if (paragraphs.length === 0) return null
  canvasContext ??= document.createElement('canvas').getContext('2d')
  if (!canvasContext) return null

  const samples: number[] = []
  for (const p of paragraphs) {
    const text = (p.textContent ?? '').replace(/\s+/g, ' ').trim()
    if (text.length < 40) continue
    const style = getComputedStyle(p)
    const contentWidth = p.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
    canvasContext.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    const averageChar = canvasContext.measureText(text).width / text.length
    if (averageChar > 0) samples.push(contentWidth / averageChar)
  }
  if (samples.length === 0) return null
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  return { charsPerLine: Math.round(mean), paragraphs: samples.length }
}

export function measureSpecimen(root: HTMLElement): Diagnostics {
  const headings = Array.from(root.querySelectorAll('[data-diag-heading]')).map((el) => ({
    label: el.getAttribute('data-diag-heading') ?? 'Heading',
    lines: countLines(el),
  }))
  return {
    specimenWidth: Math.round(root.getBoundingClientRect().width),
    headings,
    ...measureOverflow(root),
    body: measureBody(root),
  }
}
