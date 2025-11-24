// src/lib/api.ts
import axios from "axios";

/**
 * API 설정
 * - 기본 baseURL: Firebase Functions (환경변수 없을 때 폴백)
 * - /app + /api 프리픽스 중복/누락 방지: .env에서 끝의 슬래시 없이 지정
 * - Auth 토큰 자동 주입
 * - 에러 로깅
 */
const DEFAULT_FIREBASE_API =
  "https://asia-northeast3-vietnam-lounge.cloudfunctions.net/app/api";

const API_URL = (import.meta as any).env?.VITE_API_BASE_URL || DEFAULT_FIREBASE_API;

const api = axios.create({
  baseURL: API_URL, // 예: https://...cloudfunctions.net/app/api
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth-token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response) {
      console.warn(`API ${err.response.status}: ${err.response.config?.url}`);
    }
    return Promise.reject(err);
  }
);

export { api };
export default api;
