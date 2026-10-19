import { useCallback, useRef, useState } from 'react'
import { getFont, nearestSupportedWeight, strongWeightFor, type FontId } from '../model/fonts.ts'
import type { Typography } from '../model/settings.ts'
import { familyStatus, loadFamily, retryFamily } from './fontLoader.ts'

/**
 * Choosing a font loads it first and commits it to the specimen only once it
 * is ready, so the preview never drops to a fallback face mid-switch.
 *
 * - Only the most recent choice can commit: a slow earlier load that finishes
 *   later is ignored.
 * - A family that is already loaded commits immediately, with no loading flash.
 * - A failed load is reported and nothing is committed.
 */
export function useFontSelection(typography: Typography, commit: (id: FontId) => void) {
  const [pendingId, setPendingId] = useState<FontId | null>(null)
  const [failedId, setFailedId] = useState<FontId | null>(null)
  const latest = useRef<FontId | null>(null)

  const cancel = useCallback(() => {
    latest.current = null
    setPendingId(null)
    setFailedId(null)
  }, [])

  const choose = useCallback(
    (id: FontId) => {
      setFailedId(null)
      if (id === typography.fontId) {
        cancel()
        return
      }
      const font = getFont(id)
      const weight = nearestSupportedWeight(font, typography.weight)
      const weights = [weight, strongWeightFor(font, weight)]
      const status = familyStatus(id, weights)
      if (status === 'loaded') {
        latest.current = null
        setPendingId(null)
        commit(id)
        return
      }
      latest.current = id
      setPendingId(id)
      const load = status === 'error' ? retryFamily(id, weights) : loadFamily(id, weights)
      void load.then(() => {
        if (latest.current !== id) return // superseded by a newer choice, or cancelled
        latest.current = null
        setPendingId(null)
        if (familyStatus(id, weights) === 'loaded') commit(id)
        else setFailedId(id)
      })
    },
    [typography.fontId, typography.weight, commit, cancel],
  )

  return { pendingId, failedId, choose, cancel }
}
