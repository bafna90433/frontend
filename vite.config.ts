// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig(({ mode }) => ({
  base: "/", // ✅ correct for root deploy
  plugins: [
    react(),
    legacy({
      targets: [">0.2%", "not dead", "not op_mini all"], // ✅ no heavy legacy JS
    }),
    ...(mode === "production"
      ? [viteCompression({ algorithm: "brotliCompress", ext: ".br" })]
      : []),
  ],
  build: {
    outDir: "dist",
    target: "esnext",
    minify: "esbuild",   // ✅ fast minification
    cssMinify: true,     // ✅ force CSS minification
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
