import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      useCredentials: true,
      includeAssets: ['icons/pwa-192x192.png', 'icons/pwa-512x512.png'],
      manifest: {
        name: 'Travel CRM Pro',
        short_name: 'TravelCRM',
        description: 'Professional Travel Booking & Lead Management System',
        theme_color: '#2563eb', // Standard primary blue
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // App is online-only, so we keep runtime caching minimal.
        // We only generate SW to satisfy installability requirements.
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
