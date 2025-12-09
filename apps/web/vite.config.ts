import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    // Firebase 중복 번들 방지
    dedupe: ["firebase"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Lazy load 분리 설정
          nightlife: [
            "./src/pages/Adult/AdultHome.tsx",
            "./src/pages/Adult/AdultSpotsPage.tsx",
            "./src/pages/Adult/Community/AdultCommunity.tsx",
          ],
          map: ["leaflet", "react-leaflet"],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        // 실제 Firebase Functions API
        target: "https://api-7xgeqoal7q-du.a.run.app",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
  optimizeDeps: {
    // Firebase SDK 사전 최적화 포함
    include: ["react", "react-dom", "firebase/app", "firebase/auth", "firebase/firestore"],
    exclude: ["react-leaflet"],
  },
});
