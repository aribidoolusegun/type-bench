import { fontFileUrls, getFont, type FontFamily, type FontId } from '../model/fonts.ts'

/**
 * Loads specimen fonts on demand with the CSS Font Loading API.
 *
 * - Nothing loads until it is asked for: the selected family first, the
 *   others only when someone opens the font picker or selects them.
 * - A face is added to document.fonts only after it has loaded, so the
 *   browser never shows a fallback under the selected family's name.
 * - Status is tracked per face, so a slow earlier request can never
 *   overwrite the status of the family selected after it.
 */

export type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error'

interface FaceEntry {
  status: LoadStatus
  promise: Promise<void> | null
  error?: string
}

const LOAD_TIMEOUT_MS = 15000
const entries = new Map<string, FaceEntry>()
const listeners = new Set<() => void>()
let revision = 0

function notify() {
  revision += 1
  for (const listener of listeners) listener()
}

export function subscribeToFonts(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getFontRevision(): number {
  return revision
}

/** For manual testing: ?simulate-font-failure=lora makes Lora fail to load. */
function simulatedFailure(id: FontId): boolean {
  if (typeof location === 'undefined') return false
  return new URLSearchParams(location.search).getAll('simulate-font-failure').includes(id)
}

function faceKey(font: FontFamily, weight: number): string {
  return font.source.kind === 'variable' ? font.id : `${font.id}:${weight}`
}

function descriptorWeight(font: FontFamily, weight: number): string {
  return font.source.kind === 'variable' ? `${font.weightRange[0]} ${font.weightRange[1]}` : String(weight)
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function loadFace(font: FontFamily, weight: number): Promise<void> {
  const key = faceKey(font, weight)
  const existing = entries.get(key)
  if (existing && (existing.status === 'loading' || existing.status === 'loaded') && existing.promise) {
    return existing.promise
  }

  const [url] = fontFileUrls(font, [weight])
  const entry: FaceEntry = { status: 'loading', promise: null }
  entries.set(key, entry)

  entry.promise = (async () => {
    try {
      if (!url) throw new Error(`No file for weight ${weight}`)
      if (simulatedFailure(font.id)) throw new Error('Simulated failure')
      const face = new FontFace(font.name, `url("${import.meta.env.BASE_URL}${url}") format("woff2")`, {
        weight: descriptorWeight(font, weight),
        style: 'normal',
        display: 'swap',
      })
      await withTimeout(face.load(), LOAD_TIMEOUT_MS)
      document.fonts.add(face)
      entry.status = 'loaded'
    } catch (error) {
      entry.status = 'error'
      entry.error = error instanceof Error ? error.message : 'Unknown error'
    } finally {
      notify()
    }
  })()
  notify()
  return entry.promise
}

/** Loads every face needed to render `weights` of a family. */
export function loadFamily(id: FontId, weights: readonly number[]): Promise<void> {
  const font = getFont(id)
  const unique = [...new Set(weights)]
  return Promise.all(unique.map((w) => loadFace(font, w))).then(() => undefined)
}

/** Clears failed faces so the next loadFamily call tries again. */
export function retryFamily(id: FontId, weights: readonly number[]): Promise<void> {
  const font = getFont(id)
  for (const w of weights) {
    const key = faceKey(font, w)
    if (entries.get(key)?.status === 'error') entries.delete(key)
  }
  return loadFamily(id, weights)
}

/** Combined status of the faces a family needs: any error wins, then loading. */
export function familyStatus(id: FontId, weights: readonly number[]): LoadStatus {
  const font = getFont(id)
  const statuses = [...new Set(weights)].map((w) => entries.get(faceKey(font, w))?.status ?? 'idle')
  if (statuses.includes('error')) return 'error'
  if (statuses.includes('loading')) return 'loading'
  if (statuses.length > 0 && statuses.every((s) => s === 'loaded')) return 'loaded'
  return 'idle'
}
