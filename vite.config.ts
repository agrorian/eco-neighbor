import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // ── SERVICE WORKER DISABLED ───────────────────────────────────────────
        // The service worker was intercepting JS chunk requests and returning
        // stale cached bundles (text/html fallback) instead of the updated JS.
        // This caused every App.tsx deployment to have zero effect in the browser
        // and was the root cause of the phantom U account persisting across 25+
        // deployments. The SW is disabled until a proper cache invalidation
        // strategy is implemented post-mainnet.
        // To re-enable: change to registerType: 'autoUpdate' and restore workbox config.
        registerType: 'autoUpdate',
        injectRegister: null,  // null = do not inject SW registration script
        manifest: {
          name: 'Eco-Neighbor',
          short_name: 'ENB',
          description: 'A community utility token platform.',
          theme_color: '#1A6B3C',
          background_color: '#1B2B1E',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          // Empty workbox config — SW disabled via injectRegister: null
          globPatterns: [],
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
