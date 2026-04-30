export const getOriginFromUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.origin
  } catch {
    return null
  }
}

export const normalizeOrigin = (origin: string): string => {
  try {
    return new URL(origin).origin
  } catch {
    return origin
  }
}
