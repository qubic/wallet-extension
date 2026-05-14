import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  cancelPendingClipboardClear,
  scheduleClipboardClear,
  writeToClipboard,
} from '@/lib/clipboard'

const COPY_TOAST_DURATION_MS = 1000
const COPIED_KEY_INDICATOR_MS = 1200

type CopyMessages = {
  successTitle?: string
  successDescription?: string
  errorTitle?: string
  errorDescription?: string
}

type CopyOptions = {
  key?: string
  messages?: CopyMessages
  clearAfterMs?: number
}

export const useClipboardCopy = (defaults?: CopyMessages) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const indicatorTimerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (indicatorTimerRef.current) {
        window.clearTimeout(indicatorTimerRef.current)
      }
    },
    [],
  )

  const copyText = useCallback(
    async (value: string, options?: CopyOptions) => {
      const messages = { ...defaults, ...options?.messages }

      cancelPendingClipboardClear()

      const success = await writeToClipboard(value)
      if (!success) {
        if (messages.errorTitle) {
          toast.error(messages.errorTitle, {
            description: messages.errorDescription,
          })
        }
        return false
      }

      if (messages.successTitle) {
        toast.success(messages.successTitle, {
          description: messages.successDescription,
          duration: COPY_TOAST_DURATION_MS,
        })
      }

      if (options?.key) {
        setCopiedKey(options.key)
        if (indicatorTimerRef.current) {
          window.clearTimeout(indicatorTimerRef.current)
        }
        indicatorTimerRef.current = window.setTimeout(() => {
          setCopiedKey((current) => (current === options.key ? null : current))
        }, COPIED_KEY_INDICATOR_MS)
      }

      if (options?.clearAfterMs) {
        scheduleClipboardClear(options.clearAfterMs)
      }

      return true
    },
    [defaults],
  )

  return { copiedKey, copyText }
}
