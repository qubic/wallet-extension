import { webcrypto } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { createContext, runInContext } from 'node:vm'
import { build } from 'vite'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { QubicProvider } from '@/lib/dapp/provider'

let providerBundle: string

beforeAll(async () => {
  const result = await build({
    configFile: false,
    publicDir: false,
    logLevel: 'silent',
    build: {
      write: false,
      minify: 'esbuild',
      rollupOptions: {
        input: fileURLToPath(new URL('./inpage-provider.ts', import.meta.url)),
        output: { format: 'es' },
      },
    },
  })
  if (Array.isArray(result) || !('output' in result)) {
    throw new Error('Expected a single provider build')
  }
  const entry = result.output.find((file) => file.type === 'chunk' && file.isEntry)
  if (!entry || entry.type !== 'chunk') throw new Error('Provider entry was not emitted')
  providerBundle = entry.code
})

const createPage = () => {
  const window = {
    qubic: undefined as QubicProvider | undefined,
    addEventListener: vi.fn(),
    postMessage: vi.fn(),
    setTimeout: vi.fn(() => 1),
    clearTimeout: vi.fn(),
  }
  const context = createContext({
    window,
    document: { currentScript: { dataset: { qubicSession: 'test-session' } } },
    crypto: webcrypto,
  })
  return { window, context, inject: () => runInContext(providerBundle, context) }
}

describe('inpage provider classic-script bundle', () => {
  const hostNames = ['_', ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ']
  const hostScript = `const ${hostNames.map((name) => `${name} = 'host:${name}'`).join(',')};`

  it.each([
    'before',
    'after',
  ])('does not collide with host bindings declared %s injection', (order) => {
    const page = createPage()
    if (order === 'before') runInContext(hostScript, page.context)
    expect(page.inject).not.toThrow()
    if (order === 'after') {
      expect(() => runInContext(hostScript, page.context)).not.toThrow()
    }
    expect(runInContext(`[${hostNames.join(',')}]`, page.context)).toEqual(
      hostNames.map((name) => `host:${name}`),
    )
    expect(page.window.qubic?.isQubic).toBe(true)
  })

  it('can be injected twice without redeclaring globals or replacing the provider', () => {
    const page = createPage()
    page.inject()
    const provider = page.window.qubic
    expect(page.inject).not.toThrow()
    expect(page.window.qubic).toBe(provider)
    expect(page.window.addEventListener).toHaveBeenCalledTimes(1)
  })

  it('preserves currentScript session binding and request/response handling', async () => {
    const page = createPage()
    page.inject()
    const response = page.window.qubic?.getAccount()
    const [request, origin] = page.window.postMessage.mock.calls[0]
    expect(origin).toBe('*')
    expect(request).toMatchObject({
      channel: 'qubic:dapp',
      source: 'qubic:inpage',
      method: 'getAccount',
      session: 'test-session',
    })
    const handler = page.window.addEventListener.mock.calls[0][1]
    const result = { ...request, source: 'qubic:content', ok: true, result: null }
    handler({ source: page.window, data: { ...result, session: 'another-session' } })
    expect(page.window.clearTimeout).not.toHaveBeenCalled()
    handler({ source: page.window, data: result })
    await expect(response).resolves.toBeNull()
    expect(page.window.clearTimeout).toHaveBeenCalledWith(1)
  })
})
