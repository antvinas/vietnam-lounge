// C:\project\vietnam-lounge\apps\web\vite.config.ts
import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  // ✅ 모노레포에서 pnpm dev를 루트에서 쳐도 apps/web/.env를 읽게 고정
  const env = loadEnv(mode, __dirname, "");

  const port = Number(env.VITE_PORT || 5173);
  const previewPort = Number(env.VITE_PREVIEW_PORT || 4173);

  // =========================================================
  // 운영 권장 구조:
  // - 프론트(axios)는 baseURL="/api" (같은 도메인 상대경로)
  // - 운영(Firebase Hosting)은 /api/** -> Functions(api)로 rewrite
  // - 개발(Vite)은 /api/** -> "배포된 Functions(api)"로 프록시
  //
  // ⚠️ 여기서 proxy target은 절대 "/api" 같은 상대경로가 되면 안 됨
  //     (자기 자신(5173)으로 되돌아가 500 발생)
  // =========================================================

  const projectId = env.VITE_FIREBASE_PROJECT_ID || "vietnam-lounge";
  const region =
    env.VITE_FUNCTIONS_REGION ||
    env.VITE_FIREBASE_FUNCTIONS_REGION ||
    "us-central1";

  // (옵션) 에뮬레이터를 쓰고 싶을 때만 true
  const useEmulators = String(env.VITE_USE_EMULATORS || "false") === "true";

  const emulatorHost = env.VITE_EMULATOR_HOST || env.VITE_EMU_HOST || "127.0.0.1";
  const emulatorFnPort = Number(env.VITE_EMU_FN_PORT || 5001);

  // firebase functions emulator URL 패턴:
  // http://127.0.0.1:5001/<projectId>/<region>/api
  const defaultEmulatorTarget = `http://${emulatorHost}:${emulatorFnPort}/${projectId}/${region}/api`;

  // 배포된 Functions(api) 기본값:
  // https://<region>-<projectId>.cloudfunctions.net/api
  const defaultDeployedTarget = `https://${region}-${projectId}.cloudfunctions.net/api`;

  // ✅ 프록시 타겟은 VITE_API_TARGET만 사용 (VITE_API_URL=/api 와 분리!)
  const rawProxyTarget =
    env.VITE_API_TARGET || (useEmulators ? defaultEmulatorTarget : defaultDeployedTarget);

  const proxyTarget = rawProxyTarget.replace(/\/+$/, "");

  // target이 .../api 로 끝나면, 들어오는 /api 접두사를 떼서 중복(/api/api) 방지
  const stripApiPrefixEnv = env.VITE_PROXY_STRIP_API_PREFIX;
  const stripApiPrefix =
    stripApiPrefixEnv != null
      ? stripApiPrefixEnv !== "false"
      : proxyTarget.endsWith("/api");

  const proxyApi: ProxyOptions = {
    target: proxyTarget,
    changeOrigin: true,
    secure: proxyTarget.startsWith("https://"),
    rewrite: (p) => (stripApiPrefix ? p.replace(/^\/api/, "") : p),
  };

  return {
    envDir: __dirname,

    plugins: [react()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
      dedupe: ["firebase"],
    },

    server: {
      port,
      strictPort: true,
      proxy: {
        "/api": proxyApi,
      },
    },

    preview: {
      port: previewPort,
      strictPort: true,
      proxy: {
        "/api": proxyApi,
      },
    },
  };
});
