import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSitemapPlugin } from './scripts/vite-plugin-sitemap'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    viteSitemapPlugin('https://bolotova.site', [
      { path: '/', changefreq: 'weekly', priority: 1.0 },
      { path: '/projects', changefreq: 'monthly', priority: 0.8 },
      { path: '/resume', changefreq: 'monthly', priority: 0.8 }
    ])
  ],
  server: {
    hmr: {
      overlay: false
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    cssCodeSplit: true, // Enable CSS code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          vendor: ['vue', 'vue-router']
        },
        // Asset file naming for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    // Minification and compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn', 'console.error'] // Explicitly remove all console methods
      }
    }
  },
  // Asset optimization
  assetsInclude: ['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.svg', '**/*.gif', '**/*.webp'],
  test: {
    globals: true,
    environment: 'jsdom'
  }
})
