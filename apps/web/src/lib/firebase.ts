// apps/web/src/lib/firebase.ts
import { initializeApp, getApp, getApps, type FirebaseOptions } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

/**
 * envAny:
 * - 여러 후보 키 중 먼저 존재하는 값을 사용
 * - 팀/브랜치마다 env 키 네이밍이 흔들릴 때 크래시 방지
 */
function envAny(keys: string[]): string | undefined {
  for (const k of keys) {
    const v = (import.meta.env as any)?.[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

function requireEnv(name: string, value?: string) {
  if (!value) {
    throw new Error(
      `[Firebase] Missing env: ${name}. apps/web/.env(.local)에 ${name}=... 를 추가해야 합니다.`
    );
  }
}

/**
 * ✅ 최소 필수만 강제
 * - Auth/Firestore를 쓰려면 apiKey/authDomain/projectId는 거의 필수
 * - storageBucket/messagingSenderId/appId는 프로젝트에 따라 누락될 수 있으니
 *   "없으면 경고"로 처리하고, 앱이 아예 죽지는 않게 함
 */
const apiKey = envAny(["VITE_FIREBASE_API_KEY"]);
const authDomain = envAny(["VITE_FIREBASE_AUTH_DOMAIN"]);
const projectId = envAny(["VITE_FIREBASE_PROJECT_ID"]);
const storageBucket =
  envAny(["VITE_FIREBASE_STORAGE_BUCKET"]) || (projectId ? `${projectId}.appspot.com` : undefined);

// 👇 여기: 네가 현재 빠뜨린 값(또는 키명이 다른 값)들
const messagingSenderId = envAny([
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_MESSAGING_SENDERID",
  "VITE_FIREBASE_SENDER_ID",
]);

const appId = envAny(["VITE_FIREBASE_APP_ID", "VITE_FIREBASE_APPID"]);

requireEnv("VITE_FIREBASE_API_KEY", apiKey);
requireEnv("VITE_FIREBASE_AUTH_DOMAIN", authDomain);
requireEnv("VITE_FIREBASE_PROJECT_ID", projectId);

const firebaseConfig: FirebaseOptions = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  // 아래 2개는 없어도 initializeApp 자체는 가능(서비스 일부 제한될 수 있음)
  ...(messagingSenderId ? { messagingSenderId } : {}),
  ...(appId ? { appId } : {}),
};

if (!messagingSenderId) {
  // 앱은 살리고, 원인을 분명히 알려줌
  console.warn(
    "[Firebase] VITE_FIREBASE_MESSAGING_SENDER_ID is missing. (FCM/일부 기능에 영향) .env(.local)을 확인하세요."
  );
}
if (!appId) {
  console.warn(
    "[Firebase] VITE_FIREBASE_APP_ID is missing. (Analytics/일부 기능에 영향) .env(.local)을 확인하세요."
  );
}

// ✅ 어떤 파일에서 import 해도 안전: 이미 있으면 재사용, 없으면 생성
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const functions = getFunctions(firebaseApp);

// ---- Emulator 연결(선택) ----
// ✅ env 키가 브랜치/팀마다 흔들리는 것을 흡수
// - VITE_USE_FIREBASE_EMULATORS (권장)
// - VITE_USE_EMULATORS (레거시)
const useEmulators =
  String(
    (import.meta.env as any).VITE_USE_FIREBASE_EMULATORS ??
      (import.meta.env as any).VITE_USE_EMULATORS
  ).toLowerCase() === "true";

if (useEmulators) {
  const w = window as unknown as { __VN_EMU_CONNECTED__?: boolean };
  if (!w.__VN_EMU_CONNECTED__) {
    w.__VN_EMU_CONNECTED__ = true;

    const host = String((import.meta.env as any).VITE_EMULATOR_HOST || "127.0.0.1");
    const authPort = Number((import.meta.env as any).VITE_EMU_AUTH_PORT || 9099);
    const fsPort = Number((import.meta.env as any).VITE_EMU_FS_PORT || 8080);
    const storagePort = Number((import.meta.env as any).VITE_EMU_STORAGE_PORT || 9199);
    const fnPort = Number((import.meta.env as any).VITE_EMU_FN_PORT || 5001);

    connectAuthEmulator(auth, `http://${host}:${authPort}`);
    connectFirestoreEmulator(db, host, fsPort);
    connectStorageEmulator(storage, host, storagePort);
    connectFunctionsEmulator(functions, host, fnPort);
  }
}

export const app = firebaseApp;