import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { buildManifest, type ManifestMode } from './manifest.config'
import { version } from './package.json'

// Vite modes this project understands:
//   - "production"  — standard `vite build`, emits to dist/ for the Chrome Web Store bundle.
//   - "development" — standard `vite dev`, used by `bun dev` for the web-hosted preview.
//   - "extension"   — custom mode used by `bun run dev:extension`. Builds an unpacked
//                     dev extension to dist-dev/, emits reload.json for live reload,
//                     and swaps in the "(Dev)" manifest variant so it can coexist
//                     with the store build.
const SUPPORTED_MODES = ['production', 'development', 'extension'] as const

const extensionReloadPlugin = (enabled: boolean): Plugin => ({
  name: 'extension-reload-stamp',
  generateBundle() {
    if (!enabled) return
    const payload = JSON.stringify({ buildId: Date.now() })
    this.emitFile({
      type: 'asset',
      fileName: 'reload.json',
      source: payload,
    })
  },
})

const manifestPlugin = (mode: ManifestMode, outDir: string): Plugin => ({
  name: 'emit-manifest',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'manifest.json',
      source: `${JSON.stringify(buildManifest(mode), null, 2)}\n`,
    })
  },
  closeBundle() {
    if (mode !== 'production') return
    const defaultLocalePath = resolve(outDir, '_locales/en/messages.json')
    if (!existsSync(defaultLocalePath)) {
      throw new Error(
        `Production manifest references __MSG_*__ with default_locale "en", but ${defaultLocalePath} was not emitted. Chrome will refuse to install the extension.`,
      )
    }
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (!SUPPORTED_MODES.includes(mode as (typeof SUPPORTED_MODES)[number])) {
    throw new Error(
      `Unsupported Vite mode "${mode}". Expected one of: ${SUPPORTED_MODES.join(', ')}.`,
    )
  }
  const isExtensionDev = mode === 'extension'
  const outDir = isExtensionDev ? 'dist-dev' : 'dist'

  return {
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    base: './',
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      extensionReloadPlugin(isExtensionDev),
      manifestPlugin(isExtensionDev ? 'development' : 'production', outDir),
    ],
    build: {
      outDir,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html'),
          popup: resolve(__dirname, 'popup.html'),
          sidepanel: resolve(__dirname, 'sidepanel.html'),
          background: resolve(__dirname, 'src/extension/background.ts'),
          'content-script': resolve(__dirname, 'src/extension/content-script.ts'),
          'inpage-provider': resolve(__dirname, 'src/extension/inpage-provider.ts'),
        },
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: ({ name }) =>
            name === 'dapp-protocol' || name === 'dapp-timing'
              ? 'assets/[name].js'
              : 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          manualChunks: (id) => {
            const normalized = id.replaceAll('\\', '/')
            if (normalized.endsWith('/src/lib/dapp/protocol.ts')) return 'dapp-protocol'
            if (normalized.endsWith('/src/lib/dapp/timing.ts')) return 'dapp-timing'
            return undefined
          },
        },
      },
    },
  }
})
