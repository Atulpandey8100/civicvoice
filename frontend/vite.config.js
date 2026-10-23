import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'CivicVoice',
        short_name: 'CivicVoice',
        description: 'Raise your voice. Improve your community.',
        lang: 'en-IN',
        dir: 'ltr',
        theme_color: '#0757D5',
        background_color: '#0757D5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['social', 'utilities'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // SPA routing (React Router etc.)
        navigateFallback: '/index.html',
        // API aur uploads service worker fallback se bahar
        navigateFallbackDenylist: [/^\/api/, /^\/uploads/],
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webp}'],
        // Bade JS bundle ke liye (default 2 MB hai)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // Map ka geojson: pehle cache se, peeche se update
          {
            urlPattern: /\.geojson$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'geojson-cache',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          // API hamesha network se (fresh data)
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkOnly'
          }
        ]
      },
      // Dev me test karna ho to true kar do
      devOptions: { enabled: false }
    })
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000'
    }
  }
});