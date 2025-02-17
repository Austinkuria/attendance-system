import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import envCompatible from 'vite-plugin-env-compatible';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      manifest: {
        name: 'My Attendance App',
        short_name: 'Attendance',
        description: 'A Progressive Web App for Attendance Tracking',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        start_url: '/',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        screenshots: [
          {
            src: '/screenshot1.png',
            sizes: '1080x1920',
            type: 'image/png',
            form_factor: 'wide',
          },
          {
            src: '/screenshot2.png',
            sizes: '1080x1920',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        clientsClaim: true, // Ensures the new service worker takes control immediately
        skipWaiting: true, // Skips the waiting phase and activates the new service worker immediately
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst', // Always try to fetch fresh content from the network
            options: {
              cacheName: 'html-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
      registerType: 'autoUpdate', // Automatically updates the service worker
      devOptions: {
        enabled: true, // Enable PWA in development mode
      },
    }),
    envCompatible(),
  ],
});