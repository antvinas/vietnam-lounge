// apps/web/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        // ✅ 무조건 실제 Firebase Functions URL 사용
        target: "https://api-7xgeqoal7q-du.a.run.app",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom"],
    exclude: ["react-leaflet"], // react-leaflet pre-bundling 문제 방지
  },
});
