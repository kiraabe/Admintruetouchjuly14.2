import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import dynamicImport from 'vite-plugin-dynamic-import'
import http from 'http'

const checkPortAvailable = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const req = http.request(
      { host: 'localhost', port, method: 'HEAD' },
      () => resolve(true),
      () => resolve(false)
    )
    req.on('error', () => resolve(false))
    req.end()
  })
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), dynamicImport()],
  assetsInclude: ['**/*.md'],
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      }
    }
  },
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  preview: {
    port: 4173,
  },
})
