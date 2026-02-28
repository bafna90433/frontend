// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";
// ❌ legacy plugin hata diya gaya hai bundle size aadi karne ke liye

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    base: "/",
    plugins: [
      react(),
      
      // ✅ PWA (Slightly optimized with Cloudinary caching)
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
      target: "esnext",
      minify: "esbuild", 
      cssMinify: true, 
      sourcemap: false,
      chunkSizeWarningLimit: 1000, // Warning limit badhai hai thodi
      rollupOptions: {
        output: {
          // ✅ ADVANCED CHUNK SPLITTING: Heavy libraries ko alag-alag tukdon me todega
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom")) return "vendor-react";
              if (id.includes("react-router")) return "vendor-router";
              if (id.includes("@mui")) return "vendor-mui"; // MUI bahut heavy hoti hai
              if (id.includes("react-icons")) return "vendor-icons";
              if (id.includes("react-slick") || id.includes("slick-carousel")) return "vendor-slider";
              return "vendor-core"; // Baki bachi hui libraries
            }
          },
        },
      },
    },

    // ✅ Production mein console.log aur debugger automatically remove karega
    esbuild: {
      drop: isProd ? ["console", "debugger"] : [],
    },

    server: { port: 3000 },
    preview: { port: 5000 },
  };
});