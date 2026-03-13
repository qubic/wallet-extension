export const getChromeApi = () =>
  (globalThis as typeof globalThis & { chrome?: typeof chrome }).chrome ?? null

export const getChromeRuntime = () => getChromeApi()?.runtime ?? null

export const getChromeLocalStorage = () => getChromeApi()?.storage?.local ?? null

export const getChromeSessionStorage = () => getChromeApi()?.storage?.session ?? null
