import type { ContentLength } from '../model/settings.ts'

/**
 * A fictional workshop listing in a booking app: heading, supporting copy,
 * metadata, actions and short content sections, as on a real phone screen.
 */

export interface MobileSection {
  heading: string
  paragraphs: string[]
  list?: string[]
}

export interface MobileContent {
  appBarBack: string
  appBarAction: string
  eyebrow: string
  heading: string
  summary: string
  meta: { label: string; value: string }[]
  primaryAction: string
  secondaryAction: string
  sections: MobileSection[]
  tabs: string[]
  activeTab: string
}

const SECTIONS: readonly MobileSection[] = [
  {
    heading: 'What you’ll learn',
    paragraphs: ['You will set a short text by hand, lock it into the press and print a small edition on cotton paper.'],
    list: ['Choosing and setting metal type', 'Spacing, leading and locking up a forme', 'Inking evenly and pulling clean proofs'],
  },
  {
    heading: 'Schedule',
    paragraphs: [
      'Saturday starts at 10:00 with a tour of the studio and a first proof before lunch. Sunday is spent printing your own edition, with time to trim and sign the finished sheets.',
    ],
  },
  {
    heading: 'What to bring',
    paragraphs: [
      'Wear clothes you don’t mind getting ink on and bring a short text you would like to print: a favourite line, a recipe or a few words for someone.',
    ],
  },
  {
    heading: 'About your tutor',
    paragraphs: [
      'Ines Calloway has run the studio for twelve years and teaches small groups so that everyone gets time on the press.',
      'She still sets most of her own work by hand and keeps a drawer of the studio’s oldest type for workshop guests to try.',
    ],
  },
]

const SECTION_COUNTS: Record<ContentLength, number> = { short: 1, standard: 2, long: 3, extended: 4 }

export function mobileContent(length: ContentLength, longHeadings: boolean): MobileContent {
  const summary =
    length === 'short'
      ? 'Two days of setting type by hand and printing your own edition.'
      : 'Spend a weekend setting metal type by hand and printing a small edition to take home. No experience needed: the studio provides tools, paper and ink.'

  return {
    appBarBack: 'Workshops',
    appBarAction: 'Share',
    eyebrow: 'Workshop · 2 days',
    heading: longHeadings ? 'Letterpress for beginners: setting, inking and printing your first broadside' : 'Letterpress for beginners',
    summary,
    meta: [
      { label: 'Dates', value: 'Sat 7 – Sun 8 Nov' },
      { label: 'Location', value: 'Ashgrove Print Studio' },
      { label: 'Places', value: '4 of 10 left' },
      { label: 'Price', value: '£180' },
    ],
    primaryAction: 'Reserve a place',
    secondaryAction: 'Save',
    sections: SECTIONS.slice(0, SECTION_COUNTS[length]),
    tabs: ['Explore', 'Saved', 'Bookings', 'Profile'],
    activeTab: 'Explore',
  }
}
