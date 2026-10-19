import { useCallback, useState } from 'react'

/** Stored separately from settings, so the settings format is unchanged. */
export const INTRO_KEY = 'type-bench:intro'

/**
 * Whether the introduction is showing. Dismissal is remembered in this browser;
 * “About Type Bench” brings it back. If storage is unavailable, dismissal lasts
 * for the visit.
 */
export function useIntro(storage: Storage | null) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return storage?.getItem(INTRO_KEY) === 'dismissed'
    } catch {
      return false
    }
  })

  const remember = useCallback(
    (value: boolean) => {
      try {
        if (value) storage?.setItem(INTRO_KEY, 'dismissed')
        else storage?.removeItem(INTRO_KEY)
      } catch {
        // Storage refused: the choice still applies for this visit.
      }
    },
    [storage],
  )

  const dismiss = useCallback(() => {
    setDismissed(true)
    remember(true)
  }, [remember])

  const reopen = useCallback(() => {
    setDismissed(false)
    remember(false)
  }, [remember])

  return { open: !dismissed, dismiss, reopen }
}
