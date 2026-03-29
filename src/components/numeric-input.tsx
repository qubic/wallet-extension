import { useCallback, useRef, type ClipboardEvent, type ChangeEvent } from 'react'
import { Input } from '@/components/ui/input'
import { cn, formatNumber, parseFormattedInteger } from '@/lib/utils'

type NumericInputProps = Omit<React.ComponentProps<typeof Input>, 'onChange' | 'type' | 'value'> & {
  value: string
  onChange: (formatted: string) => void
}

const MAX_DIGITS = 15

const formatDigits = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, MAX_DIGITS)
  if (!digits) return ''
  return formatNumber(BigInt(digits))
}

const countDigits = (str: string, end: number): number => {
  let count = 0
  for (let i = 0; i < end; i++) {
    if (str[i] >= '0' && str[i] <= '9') count++
  }
  return count
}

const findCursorPosition = (formatted: string, digitIndex: number): number => {
  let count = 0
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] >= '0' && formatted[i] <= '9') {
      count++
      if (count === digitIndex) return i + 1
    }
  }
  return formatted.length
}

const NumericInput = ({ value, onChange, className, ...props }: NumericInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const el = e.target
      const cursorPos = el.selectionStart ?? el.value.length
      const digitsBefore = countDigits(el.value, cursorPos)
      const formatted = formatDigits(el.value)
      onChange(formatted)
      requestAnimationFrame(() => {
        if (!inputRef.current) return
        const newPos = digitsBefore === 0 ? 0 : findCursorPosition(formatted, digitsBefore)
        inputRef.current.setSelectionRange(newPos, newPos)
      })
    },
    [onChange],
  )

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const text = e.clipboardData.getData('text')
      const parsed = parseFormattedInteger(text)
      if (parsed === null) return
      const capped = BigInt(parsed.toString().slice(0, MAX_DIGITS))
      onChange(formatNumber(capped))
    },
    [onChange],
  )

  return (
    <Input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      onPaste={handlePaste}
      className={cn('text-right placeholder:text-left focus:placeholder:opacity-0', className)}
      {...props}
    />
  )
}

export default NumericInput
