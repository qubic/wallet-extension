import type { SeedVault } from '@qubic-labs/sdk'
import { getWatchOnlyAccounts } from './accounts'

const RSA_ALG = {
  name: 'RSA-OAEP',
  modulusLength: 4096,
  publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
  hash: { name: 'SHA-256' },
}

const AES_ALG = {
  name: 'AES-GCM',
  length: 256,
  iv: new Uint8Array(12).fill(0),
}

function bytesToBase64(arr: Uint8Array): string {
  return btoa(Array.from(arr, (b) => String.fromCharCode(b)).join(''))
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export async function exportVaultToWebWalletFormat(
  vault: SeedVault,
  password: string
): Promise<{ salt: string; iv: string; cipher: string }> {
  // Generate RSA key pair
  const keyPair = await crypto.subtle.generateKey(RSA_ALG, true, ['encrypt', 'decrypt'])
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey)

  // Build seeds array by encrypting each seed with the RSA public key
  const entries = vault.list()
  const watchOnlyIds = new Set(getWatchOnlyAccounts().map(acc => acc.identity))
  const seeds = []

  for (const entry of entries) {
    const isOnlyWatch = watchOnlyIds.has(entry.identity)
    if (isOnlyWatch) {
      seeds.push({
        encryptedSeed: '',
        alias: entry.name,
        publicId: entry.identity,
        isOnlyWatch: true,
      })
    } else {
      const seedStr = await vault.getSeed(entry.identity)
      const encryptedSeed = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        keyPair.publicKey,
        new TextEncoder().encode(seedStr)
      )
      seeds.push({
        encryptedSeed: btoa(String.fromCharCode(...new Uint8Array(encryptedSeed))),
        alias: entry.name,
        publicId: entry.identity,
        isOnlyWatch: false,
      })
    }
  }

  // Wrap private key with password-derived AES key (fixed salt/IV per spec)
  const pwKeyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )
  const wrapKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new Uint8Array(16).fill(0), iterations: 100000, hash: 'SHA-256' },
    pwKeyMaterial,
    AES_ALG,
    true,
    ['wrapKey', 'unwrapKey']
  )
  const wrappedPrivateKey = await crypto.subtle.wrapKey('jwk', keyPair.privateKey, wrapKey, AES_ALG)

  // Build vault file and encrypt with random salt/IV
  const vaultFile = {
    privateKey: arrayBufferToBase64(wrappedPrivateKey),
    publicKey: publicKeyJwk,
    configuration: { seeds, publicKey: publicKeyJwk },
  }

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const vaultKeyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  const vaultKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    vaultKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    vaultKey,
    new TextEncoder().encode(JSON.stringify(vaultFile))
  )

  return {
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    cipher: bytesToBase64(new Uint8Array(cipherBuf)),
  }
}
