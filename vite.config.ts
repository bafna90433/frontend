// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";
import axios from "axios"; 

export default defineConfig(async ({ mode }) => {
  const isProd = mode === "production";

  // The dynamic routes block has been removed as sitemap generation
  // is now handled dynamically at the edge by Cloudflare Pages Functions.


  return {
    base: "/",
    plugins: [
      react(),

      // ❌ Sitemap handled by Cloudflare Pages Functions now

      // ❌ PWA REMOVED FROM HERE ❌

      ...(isProd
        ? [
            viteCompression({ algorithm: "gzip", ext: ".gz" }),
            viteCompression({ algorithm: "brotliCompress", ext: ".br" }),
          ]
        : []),
    ],

    build: {
      outDir: "dist",
      target: ["es2015", "safari11"],
      minify: "esbuild",
      cssMinify: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            icons: ['lucide-react', 'react-icons'],
          }
        }
      }
    },

    esbuild: {
      drop: isProd ? ["console", "debugger"] : [],
    },

    server: { port: 3000 },
    preview: { port: 5000 },
  };
});