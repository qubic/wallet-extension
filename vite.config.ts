import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

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
    plugins: [react(), tailwindcss()],
    build: {
      outDir: isExtensionDev ? 'dist-dev' : 'dist',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html'),
          popup: resolve(__dirname, 'popup.html'),
        },
      },
    },
  }
})
