import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const renderApiUrl = 'https://onlynotes-xeat.onrender.com'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || (mode === 'production' ? renderApiUrl : '')
    ),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
}))
