import { useRef } from 'react'

type Options = { enabled?: boolean }

export const useDrawerAutoFocus = <T extends HTMLElement>(options: Options = {}) => {
  const ref = useRef<T>(null)
  const enabled = options.enabled ?? true

  const onOpenAutoFocus = (event: Event) => {
    if (!enabled) return
    event.preventDefault()
    ref.current?.focus()
  }

  return { ref, onOpenAutoFocus }
}
