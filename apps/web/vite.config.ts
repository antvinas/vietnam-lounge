import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // ✅ @ → apps/web/src
    },
  },
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:5001/vietnam-lounge-471209/asia-northeast3/api`,
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
