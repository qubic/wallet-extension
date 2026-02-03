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
          tab: resolve(__dirname, 'tab.html'),
        },
      },
    },
  }
})
