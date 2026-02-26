export const bytesToBase64 = (value: Uint8Array): string => {
  let binary = ''
  const chunkSize = 0x8000
  for (let index = 0; index < value.length; index += chunkSize) {
    binary += String.fromCharCode(...value.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

export const base64ToBytes = (value: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0)) as Uint8Array<ArrayBuffer>

export const arrayBufferToBase64 = (buffer: ArrayBuffer): string =>
  bytesToBase64(new Uint8Array(buffer))
