export function downloadText(filename: string, text: string, mimeType: string): boolean {
  try {
    const url = URL.createObjectURL(new Blob([text], { type: `${mimeType};charset=utf-8` }))
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    // Give the browser a moment to start the download before revoking.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    return true
  } catch {
    return false
  }
}
