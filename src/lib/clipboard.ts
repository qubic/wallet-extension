export const SEED_CLIPBOARD_CLEAR_MS = 60_000

// Single space rather than empty string — empty selections turn
// execCommand('copy') into a no-op on some Chromium versions.
const CLEARED_CLIPBOARD_VALUE = ' '

// execCommand is deprecated but it's the only clipboard write that doesn't
// require document focus in Chrome extension pages — important when this
// runs from a setTimeout after the user has switched apps.
const writeViaExecCommand = (text: string): boolean => {
  const mark = document.createElement('span')
  mark.textContent = text
  mark.style.all = 'unset'
  mark.style.position = 'fixed'
  mark.style.top = '0'
  mark.style.clip = 'rect(0, 0, 0, 0)'
  mark.style.whiteSpace = 'pre'
  mark.style.userSelect = 'text'

  document.body.appendChild(mark)

  const selection = document.getSelection()
  const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

  const range = document.createRange()
  range.selectNodeContents(mark)
  selection?.removeAllRanges()
  selection?.addRange(range)

  let success = false
  try {
    success = document.execCommand('copy')
  } catch {
    // keep success = false
  }

  selection?.removeAllRanges()
  if (previousRange) selection?.addRange(previousRange)
  document.body.removeChild(mark)

  return success
}

export const writeToClipboard = async (text: string): Promise<boolean> => {
  if (writeViaExecCommand(text)) return true
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

let pendingClearTimer: number | null = null

export const cancelPendingClipboardClear = (): void => {
  if (pendingClearTimer !== null) {
    window.clearTimeout(pendingClearTimer)
    pendingClearTimer = null
  }
}

export const scheduleClipboardClear = (delayMs: number): void => {
  cancelPendingClipboardClear()
  pendingClearTimer = window.setTimeout(() => {
    pendingClearTimer = null
    void writeToClipboard(CLEARED_CLIPBOARD_VALUE)
  }, delayMs)
}
