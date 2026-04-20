// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";
import sitemap from "vite-plugin-sitemap";
import axios from "axios"; 

export default defineConfig(async ({ mode }) => {
  const isProd = mode === "production";

  // 1. Basic Static Routes
  let dynamicRoutes = [
    "/",
    "/products",
    "/categories",
    "/hot-deals",
    "/privacy-policy",
    "/terms-conditions",
    "/shipping-delivery",
    "/cancellation-refund",
    "/faq"
  ];

  // 2. 🔥 DYNAMIC MAGIC: Build ke time backend se saare toys fetch karo
  if (isProd) {
    try {
      console.log("🚀 Fetching all products from backend for Sitemap...");
      const res = await axios.get("https://api.bafnatoys.com/api/products");
      
      const products = res.data.products || res.data || [];
      
      const productRoutes = products.map((p: any) => {
        return p.slug ? `/product/${p.slug}` : `/product/${p._id}`;
      });

      dynamicRoutes = [...dynamicRoutes, ...productRoutes];
      console.log(`✅ Successfully added ${productRoutes.length} products to Sitemap!`);
    } catch (error) {
      console.error("❌ Sitemap Product Fetch Failed. Continuing with static routes only.", error);
    }
  }

  return {
    base: "/",
    plugins: [
      react(),

      // ✅ Automated Dynamic Sitemap Generator
      sitemap({
        hostname: "https://bafnatoys.com",
        dynamicRoutes: dynamicRoutes,
      }),

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
      target: "es2020",
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