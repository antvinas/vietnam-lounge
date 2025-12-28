// apps/web/src/config/firebase.ts
/**
 * @deprecated ✅ Firebase 초기화는 단일 모듈(@/lib/firebase)만 사용합니다.
 * - 기존 import('@/config/firebase') 호환을 위해 re-export만 유지합니다.
 */
export { app, firebaseApp, auth, db, storage, functions } from "../lib/firebase";
