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
          { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
        screenshots: [
          {
            src: '/screenshot1.png',
            sizes: '1080x1920',
            type: 'image/png',
            form_factor: 'wide',
          },
          { src: '/screenshot2.png', sizes: '1080x1920', type: 'image/png' },
        ],
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // Increase to 5MB
        runtimeCaching: [
          {
            urlPattern: /\.(?:html|js|css)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'app-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/attendance-system-w70n\.onrender\.com\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 24 * 60 * 60 },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
      registerType: 'prompt',
      devOptions: { enabled: true },
    }),
    envCompatible(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['antd'],
          charts: ['chart.js', 'react-chartjs-2'],
          utils: ['moment', 'axios']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  define: { 'process.env': {} },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    css: true,
    include: ['./tests/**/*.{test,spec}.{js,jsx}']
  }
});