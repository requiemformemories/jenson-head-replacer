import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Set base path for GitHub Pages deployment
  base: '/jenson-head-replacer/',

  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Generate sourcemaps for debugging
    sourcemap: true,
  },

  // Server configuration for development
  server: {
    port: 3000,
    open: true,
  },

  // Preview server configuration
  preview: {
    port: 4173,
  }
})
