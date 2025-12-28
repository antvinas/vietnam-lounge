// apps/web/src/features/admin/api/http.ts
// ✅ Admin API 공통 HTTP 유틸 (baseURL /api 유지 + 커서 페이지네이션 지원)

import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { client } from "@/lib/api";

/**
 * ✅ Axios baseURL이 "/api" 또는 "https://.../api"일 때,
 * client.get("/admin/...") 처럼 "/"로 시작하면 "/api"가 날아갈 수 있음
 * -> 항상 "admin/..." 형태로 보정
 */
export function normalizeApiPath(path: string) {
  const p = String(path || "").trim();
  if (!p) return p;
  if (/^https?:\/\//i.test(p)) return p; // absolute URL 그대로
  return p.replace(/^\/+/, ""); // 선행 "/" 제거
}

export function pruneParams(params?: Record<string, any>) {
  if (!params) return undefined;
  const next: Record<string, any> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    next[k] = v;
  }
  return next;
}

export async function safeGetRaw(path: string, params?: any, config?: AxiosRequestConfig) {
  return (await client.get(normalizeApiPath(path), { ...(config ?? {}), params: pruneParams(params) })) as AxiosResponse;
}

export async function safeGet<T = any>(path: string, params?: any, config?: AxiosRequestConfig) {
  const res = await safeGetRaw(path, params, config);
  return res.data as T;
}

/**
 * ✅ 커서 페이지네이션 안정 처리
 * - 백엔드가 array를 반환해도 header(x-next-cursor)로 커서를 줄 수 있음
 * - format=cursor면 { items, nextCursor }도 반환
 */
export type CursorListResult<T> = {
  items: T[];
  nextCursor: string | null;
};

export async function safeGetCursor<T = any>(path: string, params?: any, config?: AxiosRequestConfig): Promise<CursorListResult<T>> {
  const res = await safeGetRaw(path, params, config);

  const headerCursorRaw =
    (res.headers?.["x-next-cursor"] as string | undefined) ??
    (res.headers?.["X-Next-Cursor"] as string | undefined);

  const headerCursor = headerCursorRaw ? String(headerCursorRaw) : null;

  const data = res.data as any;

  // format=cursor → { items, nextCursor }
  if (data && typeof data === "object" && Array.isArray(data.items)) {
    return {
      items: data.items as T[],
      nextCursor: (data.nextCursor ?? headerCursor ?? null) as string | null,
    };
  }

  // default → array
  if (Array.isArray(data)) {
    return { items: data as T[], nextCursor: headerCursor };
  }

  // fallback
  return { items: [], nextCursor: headerCursor };
}

export async function safePost<T = any>(path: string, body?: any, config?: AxiosRequestConfig) {
  const res = await client.post(normalizeApiPath(path), body ?? {}, config);
  return res.data as T;
}

export async function safePut<T = any>(path: string, body?: any, config?: AxiosRequestConfig) {
  const res = await client.put(normalizeApiPath(path), body ?? {}, config);
  return res.data as T;
}

export async function safePatch<T = any>(path: string, body?: any, config?: AxiosRequestConfig) {
  const res = await client.patch(normalizeApiPath(path), body ?? {}, config);
  return res.data as T;
}

/**
 * ✅ DELETE는 보통 query로 하드/사유를 받는 케이스가 많음(현재 users.router.ts가 그 방식)
 * - safeDelete("...", { hard:true, reason:"..." }) 처럼 넘기면 자동으로 params로 처리
 * - 만약 body가 필요하면 safeDelete("...", { params:{}, data:{} }) 형태로 사용
 */
export async function safeDelete<T = any>(
  path: string,
  paramsOrConfig?: any,
  maybeConfig?: AxiosRequestConfig
) {
  const url = normalizeApiPath(path);

  // case1) axios config 형태로 들어온 경우: { params, data, ... }
  if (paramsOrConfig && typeof paramsOrConfig === "object" && ("params" in paramsOrConfig || "data" in paramsOrConfig)) {
    const cfg: AxiosRequestConfig = {
      ...(paramsOrConfig as AxiosRequestConfig),
      params: pruneParams((paramsOrConfig as any).params),
    };
    const res = await client.delete(url, cfg);
    return res.data as T;
  }

  // case2) plain object → query params 로 간주 (삭제 라우터 호환)
  const cfg: AxiosRequestConfig = {
    ...(maybeConfig ?? {}),
    params: pruneParams(paramsOrConfig),
  };
  const res = await client.delete(url, cfg);
  return res.data as T;
}

// ---------------------------
// helpers
// ---------------------------
export function clampInt(n: any, min: number, max: number, fallback: number) {
  const v = Number.isFinite(Number(n)) ? Number(n) : fallback;
  return Math.min(max, Math.max(min, Math.trunc(v)));
}

export function clampNumber(n: any, min: number, max: number): number | undefined {
  const v = Number(n);
  if (!Number.isFinite(v)) return undefined;
  return Math.min(max, Math.max(min, v));
}

export function normalizeText(v: any): string | undefined {
  const s = String(v ?? "").trim();
  return s ? s : undefined;
}
