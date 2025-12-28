// apps/web/src/features/auth/types/auth.types.ts

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * authApi.register() 내부용 (기존 nickname 기반 흐름 유지)
 */
export interface RegisterCredentials {
  email: string;
  password: string;
  nickname: string;
}

export type SocialProvider = "google" | "facebook";
