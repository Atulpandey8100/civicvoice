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
        theme_color: '#0757D5',
        background_color: '#0757D5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
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
        // SPA routing ke liye (React Router etc.)
        navigateFallback: '/index.html',
        // API aur uploads ko service worker cache/fallback se bahar rakho
        navigateFallbackDenylist: [/^\/api/, /^\/uploads/],
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webp}'],
        cleanupOutdatedCaches: true
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