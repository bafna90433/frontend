// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";
import legacy from "@vitejs/plugin-legacy";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  base: "/", // ✅ correct for root deploy
  plugins: [
    react(),
    legacy({
      targets: [">0.2%", "not dead", "not op_mini all"], // ✅ no heavy legacy JS
    }),

    // ✅ PWA
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: mode !== "production" }, // dev me bhi test kar sako
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

      // Optional but useful: cache strategy (default bhi ok)
      workbox: {
        navigateFallback: "/index.html", // React Router ke liye
      },
    }),

    ...(mode === "production"
      ? [viteCompression({ algorithm: "brotliCompress", ext: ".br" })]
      : []),
  ],

  build: {
    outDir: "dist",
    target: "esnext",
    minify: "esbuild", // ✅ fast minification
    cssMinify: true, // ✅ force CSS minification
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          vendor: ["axios", "react-router-dom"],
        },
      },
    },
  },

  server: { port: 3000 },
  preview: { port: 5000 },
}));
