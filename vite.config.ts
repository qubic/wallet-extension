import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

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

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isExtensionDev = mode === 'extension'

  return {
    base: './',
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    plugins: [react(), tailwindcss(), extensionReloadPlugin(isExtensionDev)],
    build: {
      outDir: isExtensionDev ? 'dist-dev' : 'dist',
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
