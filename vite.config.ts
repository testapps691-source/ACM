import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxies /kong-api/* → Kong Admin API (avoids CORS in dev)
      // Set VITE_KONG_ADMIN_URL in .env.local to your Kong instance
      '/kong-api': {
        target: process.env.VITE_KONG_ADMIN_URL ?? 'http://localhost:8001',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/kong-api/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('[kong-proxy] Kong Admin API unreachable:', err.message)
          })
        },
      },
    },
  },
})
