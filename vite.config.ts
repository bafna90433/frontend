// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";
import sitemap from "vite-plugin-sitemap";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    base: "/",
    plugins: [
      react(),

      // ✅ Sitemap (Google indexing) - Static Routes only
      sitemap({
        hostname: "https://bafnatoys.com",
        dynamicRoutes: [
          "/",
          "/products",
          "/categories",
          "/hot-deals",
          "/privacy-policy",
          "/terms-conditions",
          "/shipping-delivery",
          "/cancellation-refund",
          "/faq"
        ],
      }),

      // ✅ PWA (Optimized with Cloudinary caching)
      VitePWA({
        registerType: "autoUpdate",
        devOptions: { enabled: !isProd },
        includeAssets: ["favicon.ico", "apple-touch-icon.png"],
        manifest: {
          name: "Wholesaler",
          short_name: "Wholesaler",
          start_url: "/",
          scope: "/",
          display: "standalone",
          background_color: "#ffffff",
          theme_color: "#7c3aed",
          description: "Wholesale ordering app",
          icons: [
            { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
            { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "/pwa-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          navigateFallback: "/index.html",
          // ✅ Cloudinary images caching
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "cloudinary-images",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
              },
            },
          ],
        },
      }),

      // ✅ Gzip + Brotli (production only)
      ...(isProd
        ? [
            viteCompression({ algorithm: "gzip", ext: ".gz" }),
            viteCompression({ algorithm: "brotliCompress", ext: ".br" }),
          ]
        : []),
    ],

    build: {
      outDir: "dist",
      target: "es2020",
      minify: "esbuild",
      cssMinify: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      
      // ✅ ADDED: Code Splitting to optimize load speeds
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            icons: ['lucide-react', 'react-icons'],
          }
        }
      }
    },

    // ✅ Production mein console/debugger remove
    esbuild: {
      drop: isProd ? ["console", "debugger"] : [],
    },

    server: { port: 3000 },
    preview: { port: 5000 },
  };
});