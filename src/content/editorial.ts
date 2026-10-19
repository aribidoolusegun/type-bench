import type { ContentLength } from '../model/settings.ts'

/**
 * “Form & Field”: a short essay about typography. Paragraphs are written so
 * that every cut-off point still reads as a complete piece, which lets the
 * content-length control add material without producing nonsense.
 */

export type EditorialBlock =
  | { kind: 'p'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }

export interface EditorialContent {
  publication: string
  section: string
  headline: string
  intro: string
  author: string
  blocks: EditorialBlock[]
  readingMinutes: number
}

const HEADLINE = 'Good type makes room for ideas.'
const HEADLINE_LONG =
  'Good type makes room for ideas, even when the headline runs far longer than anyone planned for.'

const SECTION = 'A quieter kind of clarity'
const SECTION_LONG = 'A quieter kind of clarity, and why it matters more as pages grow longer and harder to follow'

const SUBSECTION = 'Testing with real constraints'
const SUBSECTION_LONG = 'Testing with real constraints: narrow screens, translated strings and numbers that keep growing'

const P = {
  opening:
    'Most of what a reader feels about a page is decided before they read a single sentence. They notice the weight of the text, the width of each line and how much air sits between paragraphs. Good typography does not ask for attention. It prepares the ground so that ideas can be taken in without effort.',
  proportion:
    'That preparation is mostly a matter of proportion. A body size that suits the screen, a line height that lets the eye return comfortably to the next line, and headings that step up in clear, consistent intervals all work together. When those relationships hold, a page feels calm even when its subject is complicated.',
  loudness:
    'Clarity is often confused with loudness. Bigger headings, heavier weights and brighter colours can make a layout feel urgent, but urgency is not the same as understanding. The clearest pages tend to use a small number of sizes, applied with discipline, so that each change in scale carries meaning.',
  scale:
    'A modular scale helps with that discipline. Starting from a base size and multiplying by a fixed ratio produces a family of sizes that relate to one another. The ratio sets the character: a small ratio gives gentle, compact steps, while a larger one creates dramatic contrast between body text and display headings.',
  judgement:
    'None of this replaces judgement. A scale that looks balanced on a wide monitor can produce towering headlines on a narrow phone, and a line height that feels generous at sixteen pixels may feel loose at twenty. The only reliable test is to set real words at real widths and look closely.',
  pressure:
    'Real interfaces rarely offer the tidy conditions of a specimen sheet. Headlines arrive longer than planned, translated strings expand, and numbers grow by several digits as a product succeeds. Each of these pressures tests whether a type system bends gracefully or breaks.',
  narrowing:
    'Narrowing the layout is the quickest way to find those breaking points. Watch where headings wrap, whether short words are left stranded on their own lines, and how the measure of the body text changes. Small adjustments to the ratio or the base size often resolve problems that no amount of manual nudging would.',
  reading:
    'It also helps to read the text rather than simply look at it. Read a full paragraph at the size you have chosen and notice whether your eye loses its place at the end of a line. If it does, the measure may be too long, or the line height too tight for the size.',
  closing:
    'Typography that works under these conditions rarely draws attention to itself. Readers simply find that the page is easy to move through, that headings help them find their way, and that nothing interrupts the ideas they came for.',
}

const WORDS_PER_MINUTE = 230

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

export function editorialContent(length: ContentLength, longHeadings: boolean): EditorialContent {
  const section = longHeadings ? SECTION_LONG : SECTION
  const subsection = longHeadings ? SUBSECTION_LONG : SUBSECTION

  const blocks: EditorialBlock[] = [
    { kind: 'p', text: P.opening },
    { kind: 'p', text: P.proportion },
    { kind: 'h2', text: section },
    { kind: 'p', text: P.loudness },
  ]
  if (length !== 'short') blocks.push({ kind: 'p', text: P.scale }, { kind: 'p', text: P.judgement })
  if (length === 'long' || length === 'extended') {
    blocks.push({ kind: 'h3', text: subsection }, { kind: 'p', text: P.pressure }, { kind: 'p', text: P.narrowing })
  }
  if (length === 'extended') blocks.push({ kind: 'p', text: P.reading }, { kind: 'p', text: P.closing })

  const intro = 'A practical study of rhythm, proportion, and the space between words.'
  const headline = longHeadings ? HEADLINE_LONG : HEADLINE
  const words = [headline, intro, ...blocks.map((b) => b.text)].reduce((n, t) => n + countWords(t), 0)

  return {
    publication: 'Form & Field',
    section: 'Essays on design',
    headline,
    intro,
    author: 'Mara Ellison',
    blocks,
    readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
  }
}
