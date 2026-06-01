export const SEED_CLIPBOARD_CLEAR_MS = 60_000

// Single space rather than empty string — empty selections turn
// execCommand('copy') into a no-op on some Chromium versions.
const CLEARED_CLIPBOARD_VALUE = ' '

// execCommand is deprecated but it's the only clipboard write that doesn't
// require document focus in Chrome extension pages — important for the
// scheduled clear, which fires from a setTimeout after the user has likely
// switched focus to another app (where navigator.clipboard rejects).
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

// For user-gesture copies (button clicks): the document is focused, so prefer
// the modern async API and only fall back to execCommand if it rejects.
export const writeToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return writeViaExecCommand(text)
  }
}

let pendingClearTimer: number | null = null

export const cancelPendingClipboardClear = (): void => {
  if (pendingClearTimer !== null) {
    window.clearTimeout(pendingClearTimer)
    pendingClearTimer = null
  }
}

// NOTE: timer lives in the page document — if torn down (popup closed,
// extension reloaded) before delayMs, the clear won't run (follow-up:
// chrome.alarms + offscreen). Uses execCommand since the doc is usually
// unfocused when this fires, where the async clipboard API rejects.
export const scheduleClipboardClear = (delayMs: number): void => {
  cancelPendingClipboardClear()
  pendingClearTimer = window.setTimeout(() => {
    pendingClearTimer = null
    writeViaExecCommand(CLEARED_CLIPBOARD_VALUE)
  }, delayMs)
}
