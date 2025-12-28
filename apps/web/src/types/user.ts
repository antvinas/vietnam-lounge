// apps/web/src/types/user.ts

export type UserRole = "admin" | "user" | "manager";
export type UserStatus = "active" | "banned";

// Firestore Timestamp({ seconds }) 형태까지 허용
export type FirestoreLikeTimestamp =
  | string
  | number
  | Date
  | { seconds: number; nanoseconds?: number }
  | null
  | undefined;

export interface User {
  /** Firestore 문서 id (보통 Firebase Auth uid와 동일하게 사용) */
  id: string;

  /** (호환) 일부 코드에서 uid를 쓰는 경우가 있어 함께 둠 */
  uid?: string;

  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;

  /** 일부 컬렉션 데이터에 없을 수 있어 optional로 두고, UI에서는 기본값 처리 */
  role?: UserRole;
  status?: UserStatus;

  emailVerified?: boolean;
  isAgeVerified?: boolean;

  phoneNumber?: string | null;
  providerId?: string;

  createdAt?: FirestoreLikeTimestamp;
  lastLoginAt?: FirestoreLikeTimestamp;

  adminMemo?: string;

  // 확장 필드 (추가 컬럼 들어와도 타입이 안 깨지게)
  [key: string]: any;
}
