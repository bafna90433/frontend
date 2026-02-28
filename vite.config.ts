// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    base: "/",
    plugins: [
      react(),
      
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
          // ✅ Cloudinary images ko cache karega jisse bar-bar download na ho
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cloudinary-images',
                expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }, // 30 Days cache
              },
            },
          ],
        },
      }),

      // ✅ Gzip + Brotli dono banayege (Safe fallback ke liye)
      ...(isProd
        ? [
            viteCompression({ algorithm: "gzip", ext: ".gz" }),
            viteCompression({ algorithm: "brotliCompress", ext: ".br" })
          ]
        : []),
    ],

    build: {
      outDir: "dist",
      target: "es2020", // ✅ Changed to 'es2020' for better compatibility without legacy bloat
      minify: "esbuild", 
      cssMinify: true, 
      sourcemap: false,
      chunkSizeWarningLimit: 1500, // Warning limit badha di gayi hai
      // ❌ Aggressive manualChunks hata diya hai blank screen error rokne ke liye
    },

    // ✅ Production mein console.log aur debugger automatically remove karega
    esbuild: {
      drop: isProd ? ["console", "debugger"] : [],
    },

    server: { port: 3000 },
    preview: { port: 5000 },
  };
});