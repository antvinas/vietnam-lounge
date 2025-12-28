export type UserRole = "user" | "admin";

export type MembershipTier =
  | "GUEST"
  | "BASIC"
  | "SILVER"
  | "GOLD"
  | "VIP"
  | "ADMIN";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  role: UserRole; // 라우팅/가드에서 쓰는 최소 권한값
}

export interface UserProfile {
  uid: string;
  email: string | null;

  // 서비스에서 쓰는 프로필 값들(백엔드 리턴에 맞춰 유연하게)
  nickname?: string | null;
  photoURL?: string | null;
  membership?: MembershipTier | null;

  // 핵심: 운영 권한
  role?: UserRole;

  // 기타 확장 필드(추가돼도 타입 깨지지 않게)
  [key: string]: unknown;
}
