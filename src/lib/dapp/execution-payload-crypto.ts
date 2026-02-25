const DAPP_EXECUTION_KEY_STORAGE_KEY = 'dapp.executionPayloadKey.v1'

type EncryptedJsonPayload = Readonly<{
  alg: 'AES-GCM'
  ivBase64: string
  ciphertextBase64: string
}>

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0))

const getSessionStorage = () => {
  const chromeApi = (globalThis as typeof globalThis & { chrome?: typeof chrome }).chrome
  return chromeApi?.storage?.session ?? null
}

const getOrCreateRawKey = async (): Promise<Uint8Array | null> => {
  const sessionStorage = getSessionStorage()
  if (!sessionStorage) return null

  const existing = await sessionStorage.get(DAPP_EXECUTION_KEY_STORAGE_KEY)
  const encoded = existing[DAPP_EXECUTION_KEY_STORAGE_KEY]
  if (typeof encoded === 'string' && encoded) {
    try {
      return fromBase64(encoded)
    } catch {
      // fall through and rotate key
    }
  }

  const raw = new Uint8Array(32)
  crypto.getRandomValues(raw)
  await sessionStorage.set({ [DAPP_EXECUTION_KEY_STORAGE_KEY]: toBase64(raw) })
  return raw
}

const importAesKey = async () => {
  const raw = await getOrCreateRawKey()
  if (!raw) return null
  return crypto.subtle.importKey('raw', raw.buffer as ArrayBuffer, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ])
}

const serializeJson = (value: unknown) =>
  JSON.stringify(value, (_key, current) => {
    if (current instanceof Uint8Array) {
      return { __qubicType: 'u8', base64: toBase64(current) }
    }
    if (typeof current === 'bigint') {
      return { __qubicType: 'bigint', value: current.toString() }
    }
    return current
  })

const deserializeJson = (value: string): unknown =>
  JSON.parse(value, (_key, current) => {
    if (!current || typeof current !== 'object') return current
    const record = current as Record<string, unknown>
    if (record.__qubicType === 'u8' && typeof record.base64 === 'string') {
      return fromBase64(record.base64)
    }
    if (record.__qubicType === 'bigint' && typeof record.value === 'string') {
      return BigInt(record.value)
    }
    return current
  })

export const encryptExecutionPayload = async (
  value: unknown,
): Promise<EncryptedJsonPayload | undefined> => {
  if (value === undefined) return undefined
  const key = await importAesKey()
  if (!key) return undefined

  const plaintext = new TextEncoder().encode(serializeJson(value))
  const iv = new Uint8Array(12)
  crypto.getRandomValues(iv)

  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return {
    alg: 'AES-GCM',
    ivBase64: toBase64(iv),
    ciphertextBase64: toBase64(new Uint8Array(encrypted)),
  }
}

export const decryptExecutionPayload = async (payload: unknown): Promise<unknown | undefined> => {
  if (!payload || typeof payload !== 'object') return undefined
  const record = payload as Record<string, unknown>
  if (
    record.alg !== 'AES-GCM' ||
    typeof record.ivBase64 !== 'string' ||
    typeof record.ciphertextBase64 !== 'string'
  ) {
    return undefined
  }

  const key = await importAesKey()
  if (!key) return undefined

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(record.ivBase64) },
      key,
      fromBase64(record.ciphertextBase64),
    )
    return deserializeJson(new TextDecoder().decode(decrypted))
  } catch {
    return undefined
  }
}
