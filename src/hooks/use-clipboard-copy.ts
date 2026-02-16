import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

type CopyMessages = {
  successTitle?: string
  successDescription?: string
  errorTitle?: string
  errorDescription?: string
}

type CopyOptions = {
  key?: string
  resetMs?: number
  messages?: CopyMessages
}

export const useClipboardCopy = (defaults?: CopyMessages) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    },
    [],
  )

  const copyText = useCallback(
    async (value: string, options?: CopyOptions) => {
      const messages = { ...defaults, ...options?.messages }

      try {
        await navigator.clipboard.writeText(value)
        if (messages.successTitle) {
          toast.success(messages.successTitle, {
            description: messages.successDescription,
          })
        }
        if (options?.key) {
          setCopiedKey(options.key)
          if (timerRef.current) {
            window.clearTimeout(timerRef.current)
          }
          timerRef.current = window.setTimeout(() => {
            setCopiedKey((current) => (current === options.key ? null : current))
          }, options.resetMs ?? 1200)
        }
        return true
      } catch {
        if (messages.errorTitle) {
          toast.error(messages.errorTitle, {
            description: messages.errorDescription,
          })
        }
        return false
      }
    },
    [defaults],
  )

  return { copiedKey, copyText, setCopiedKey }
}
