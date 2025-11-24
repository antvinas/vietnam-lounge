import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

/* 전역 토큰과 폼 스타일을 먼저 로드 */
import "@/styles/tokens.css";
import "@/styles/form.css";
import "./styles/index.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

import App from "./App";
import { router } from "./router";

import DevRouteError from "@/components/common/DevRouteError";
import Toast from "@/components/common/Toast";
import Loading from "@/components/common/Loading";

/** React Query 전역 기본값 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 15 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

/** 화면/키별 캐시 정책 분리 */
queryClient.setQueryDefaults(["plan", "detail"], {
  staleTime: 60 * 60_000,
  gcTime: 6 * 60 * 60_000,
  refetchOnWindowFocus: false,
});
queryClient.setQueryDefaults(["plan", "graph"], {
  staleTime: 60 * 60_000,
  gcTime: 6 * 60 * 60_000,
  refetchOnWindowFocus: false,
});
queryClient.setQueryDefaults(["search"], {
  staleTime: 10_000,
  gcTime: 10 * 60_000,
  keepPreviousData: true,
  retry: 0,
});
queryClient.setQueryDefaults(["spots", "search"], {
  staleTime: 10_000,
  gcTime: 10 * 60_000,
  keepPreviousData: true,
  retry: 0,
});

/** 전역 에러 바운더리 */
type EBState = { hasError: boolean; error?: unknown };
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }
  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, error: err };
  }
  componentDidCatch(err: any, info: any) {
    console.error("Global error", err, info);
  }
  render() {
    if (this.state.hasError) {
      return <DevRouteError error={this.state.error} title="애플리케이션 오류" resetHref="/" />;
    }
    return this.props.children as any;
  }
}

function Root() {
  return (
    <React.StrictMode>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            {/* 전역 토스트 & 전역 DOM 상태 적용자(App) */}
            <Toast />
            <App />
            {/* Data Router + v7 전환 준비: startTransition 적용, lazy 로딩 중 fallback */}
            <RouterProvider
              router={router}
              future={{ v7_startTransition: true }}
              fallbackElement={<Loading />}
            />
          </ErrorBoundary>
        </QueryClientProvider>
      </HelmetProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);

/** 서비스 워커 등록: dev에서 파일 없으면 스킵 */
async function registerSW() {
  if (!("serviceWorker" in navigator)) return;

  if (import.meta.env.DEV) {
    try {
      const res = await fetch("/sw.js", { method: "GET", cache: "no-store" });
      const ok = res.ok && res.headers.get("content-type")?.includes("javascript");
      if (!ok) return;
    } catch {
      return;
    }
  }

  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch (err) {
    console.warn("[SW] register failed:", err);
  }
}
registerSW();
