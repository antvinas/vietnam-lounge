// apps/web/src/lib/api.ts
import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";

/**
 * 운영 권장:
 * - 프론트는 항상 같은 도메인으로 상대경로("/api") 호출
 * - 라우팅은 Firebase Hosting rewrite(또는 프록시/리버스프록시)로 Functions "api"에 연결
 *
 * 로컬(dev)에서는 다음 순서로 baseURL을 결정합니다.
 * 1) VITE_API_URL (명시)
 * 2) (에뮬레이터 사용) Functions emulator URL
 * 3) (localhost) 배포된 Functions URL (projectId 기반 자동 추정)
 * 4) 기본 "/api"
 */

function envAny(keys: string[]): string | undefined {
  for (const k of keys) {
    const v = (import.meta.env as any)?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function isLocalhost() {
  try {
    const h = window.location.hostname;
    return (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "0.0.0.0" ||
      h === "::1" ||
      h.endsWith(".localhost")
    );
  } catch {
    return false;
  }
}

function getProjectId(): string | undefined {
  try {
    return (auth as any)?.app?.options?.projectId as string | undefined;
  } catch {
    return undefined;
  }
}

function resolveBaseURL(): string {
  const explicit = envAny(["VITE_API_URL", "VITE_API_BASE_URL"]);
  if (explicit) return explicit.replace(/\/+$/, "");

  const projectId = getProjectId();
  const region =
    envAny(["VITE_FUNCTION_REGION", "VITE_FUNCTIONS_REGION", "VITE_GCLOUD_REGION"]) ||
    "us-central1";

  // ✅ emulator 사용 시: functions emulator 주소로 강제
  const useEmulators =
    String(
      (import.meta.env as any).VITE_USE_FIREBASE_EMULATORS ??
        (import.meta.env as any).VITE_USE_EMULATORS
    ).toLowerCase() === "true";

  if (useEmulators && projectId) {
    const host = String((import.meta.env as any).VITE_EMULATOR_HOST || "127.0.0.1");
    const fnPort = Number((import.meta.env as any).VITE_EMU_FN_PORT || 5001);
    // functions emulator의 https.onRequest URL 형태
    return `http://${host}:${fnPort}/${projectId}/${region}/api`;
  }

  // ✅ localhost(dev)인데 rewrite/proxy가 없으면: 배포된 functions로 자동 fallback
  if (isLocalhost() && projectId) {
    // (gen1/대부분 환경) https://<region>-<projectId>.cloudfunctions.net/api
    // gen2/특수 URL이면 VITE_API_URL로 명시 권장
    return `https://${region}-${projectId}.cloudfunctions.net/api`;
  }

  // ✅ 기본(운영/호스팅 rewrite)
  return "/api";
}

const BASE_URL = resolveBaseURL().replace(/\/+$/, "");

export const api = axios.create({
  baseURL: BASE_URL,
  // 전역 Content-Type 강제는 FormData에서 깨질 수 있어 지정하지 않음(요청별로 설정)
  headers: { Accept: "application/json" },
});

export const client = api;
export default api;

// ---- 내부: Auth 준비 대기 (새로고침 직후 currentUser null 방지) ----
let authReadyPromise: Promise<FirebaseUser | null> | null = null;

function waitForAuthUserOnce(): Promise<FirebaseUser | null> {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);

  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve) => {
      const unsub = onAuthStateChanged(
        auth,
        (user) => {
          unsub();
          resolve(user);
        },
        () => {
          unsub();
          resolve(null);
        }
      );
    });
  }
  return authReadyPromise;
}

// ---- 요청 인터셉터: 토큰 자동 첨부 ----
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const headers: any = (config.headers ??= {});

    // ✅ FormData면 Content-Type 제거(브라우저가 boundary 자동 설정)
    try {
      if (typeof FormData !== "undefined" && config.data instanceof FormData) {
        delete headers["Content-Type"];
        delete headers["content-type"];
      } else {
        // 일반 JSON 요청은 명시(선택)
        if (!headers["Content-Type"] && !headers["content-type"]) {
          headers["Content-Type"] = "application/json";
        }
      }
    } catch {
      // ignore
    }

    // 이미 Authorization이 있으면 그대로 사용 (대소문자 방어)
    if (headers.Authorization || headers.authorization) return config;

    const user = auth.currentUser ?? (await waitForAuthUserOnce());
    if (user) {
      const token = await user.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---- 응답 인터셉터: 401이면 토큰 1회 강제 갱신 후 재시도 ----
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const cfg: any = error.config;

    // 이미 재시도한 요청은 루프 방지
    if (status !== 401 || !cfg || cfg.__retried) {
      return Promise.reject(error);
    }

    const user = auth.currentUser;
    if (!user) return Promise.reject(error);

    try {
      cfg.__retried = true;
      const fresh = await user.getIdToken(true); // ✅ forceRefresh
      cfg.headers = cfg.headers ?? {};
      cfg.headers.Authorization = `Bearer ${fresh}`;
      return api.request(cfg);
    } catch {
      return Promise.reject(error);
    }
  }
);
