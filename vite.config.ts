import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { devServerApiPlugin } from './scripts/dev-server-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    devServerApiPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Museum der Stadt Rodenberg',
        short_name: 'Museum Rodenberg',
        description: 'Digitales Museum der Stadt Rodenberg. Entdecken Sie lokale Geschichte und Artefakte.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#7c2d12',
        orientation: 'portrait',
        scope: '/',
        categories: ['education', 'culture'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/uploads\/.*/i,
            handler: 'CacheFirst',
            options: {
              // Bumped to v2 to purge stale 404s cached by the v1 SW
              cacheName: 'museum-uploads-v2',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/translations\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'museum-translations',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
            },
          },
        ],
      },
    }),
  ],

  server: {
    watch: {
      ignored: [
        '**/src/content/**',
        '**/public/uploads/**',
        '**/public/translations/**',
      ],
    },
  },
  optimizeDeps: {
    include: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'markdown-vendor': ['react-markdown', 'remark-gfm'],
          'ui-vendor': ['lucide-react', 'html5-qrcode'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
