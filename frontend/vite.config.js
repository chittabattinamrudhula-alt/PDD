import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages deployment: set VITE_BASE_PATH env var in CI
// e.g. VITE_BASE_PATH=/PDD/  for repo "PDD"
// Falls back to '/' for local dev
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  define: {
    // Inject backend URL at build time for GitHub Pages (SPA uses mock/static data)
    'import.meta.env.VITE_API_BASE': JSON.stringify(
      process.env.VITE_API_BASE || 'http://localhost:5000/api'
    ),
  },
})
