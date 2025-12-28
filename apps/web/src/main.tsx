// apps/web/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";

import App from "./App";
import { router } from "./router";
import "./index.css";

// ✅ Firebase 초기화(사이드이펙트)
import "@/lib/firebase";
// ✅ Auth bootstrap 1회 실행
import { useAuthStore } from "@/features/auth/stores/auth.store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function RouterFallback() {
  return <div className="p-6 text-center text-gray-500">페이지를 불러오는 중...</div>;
}

// ✅ 여기서 1회 실행 (StrictMode 영향 없음)
// - 일부 브랜치에서 action 이름이 달라질 수 있어 크래시 방지용 가드 추가
const authState: any = useAuthStore.getState();
if (typeof authState.bootstrap === "function") {
  authState.bootstrap();
} else if (typeof authState.bootstrapAuthListener === "function") {
  authState.bootstrapAuthListener();
} else {
  // eslint-disable-next-line no-console
  console.error("[Auth] bootstrap action is missing in useAuthStore. auth.store.ts를 확인하세요.");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        {/* ✅ App: themeMode/contentMode → html.dark 반영만 담당 */}
        <App />
        <RouterProvider router={router} fallbackElement={<RouterFallback />} />
        <Toaster position="top-center" />
      </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);
