/**
 * Copies text, trying the async Clipboard API first and the older
 * execCommand path second. Returns false when both are blocked, so the
 * caller can show the text for manual copying instead.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Permission denied or document not focused: fall through.
  }
  return legacyCopy(text)
}

function legacyCopy(text: string): boolean {
  const active = document.activeElement as HTMLElement | null
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.inset = '0 auto auto 0'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  textarea.remove()
  active?.focus({ preventScroll: true })
  return ok
}
