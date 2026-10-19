import { useEffect, useSyncExternalStore } from 'react'
import type { FontId } from '../model/fonts.ts'
import { familyStatus, getFontRevision, loadFamily, subscribeToFonts, type LoadStatus } from './fontLoader.ts'

/** Re-renders whenever any font finishes loading or fails. */
export function useFontRevision(): number {
  return useSyncExternalStore(subscribeToFonts, getFontRevision, getFontRevision)
}

/** Requests the family's faces and reports their combined status. */
export function useFontFamily(id: FontId, weights: readonly number[]): LoadStatus {
  useFontRevision()
  const key = weights.join(',')
  useEffect(() => {
    void loadFamily(id, key.split(',').map(Number))
  }, [id, key])
  return familyStatus(id, weights)
}
