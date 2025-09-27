// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";

export default defineConfig(({ mode }) => ({
  base: "/", // ✅ ensure root deploy ke liye sahi hai
  plugins: [
    react(),
    ...(mode === "production"
      ? [viteCompression({ algorithm: "brotliCompress" })]
      : []),
  ],
  build: {
    outDir: "dist",
    target: "esnext",
    minify: "esbuild",
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
  server: {
    port: 3000,
  },
  preview: {
    port: 5000,
  },
}));
