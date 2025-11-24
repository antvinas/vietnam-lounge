// v9 modular Firebase (single source of truth)
// - Vite env: only VITE_* 가 노출됨 (import.meta.env.VITE_*)
// - 에뮬레이터: VITE_USE_EMULATORS === "true" 일 때 로컬에 연결
// - 안전한 Analytics 초기화: analytics.isSupported()

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  type Auth,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore";
import {
  getStorage,
  connectStorageEmulator,
  type FirebaseStorage,
} from "firebase/storage";
import {
  getFunctions,
  connectFunctionsEmulator,
  type Functions,
} from "firebase/functions";
import {
  getAnalytics,
  isSupported,
  type Analytics,
} from "firebase/analytics";

// ---- Config from Vite env ----
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
};

const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true";

// 선택 포트(없으면 기본값 사용)
const EMU_HOST = (import.meta.env.VITE_EMULATOR_HOST as string) || "localhost";
const EMU_AUTH_PORT = Number(import.meta.env.VITE_EMU_AUTH_PORT ?? 9099);
const EMU_FS_PORT = Number(import.meta.env.VITE_EMU_FS_PORT ?? 8080);
const EMU_STORAGE_PORT = Number(import.meta.env.VITE_EMU_STORAGE_PORT ?? 9199);
const EMU_FN_PORT = Number(import.meta.env.VITE_EMU_FN_PORT ?? 5001);

// ---- Initialize (singleton safe) ----
const app: FirebaseApp =
  getApps().length ? getApp() : initializeApp(firebaseConfig);

// Core services
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
// region은 필요 시 VITE_FUNCTIONS_REGION 지정 가능. 없으면 기본(us-central1)
const functions: Functions = getFunctions(app);

// ---- Emulator wiring (must run before first call usage) ----
if (useEmulators) {
  // Auth
  // note: URL string 필수
  try {
    connectAuthEmulator(auth, `http://${EMU_HOST}:${EMU_AUTH_PORT}`, { disableWarnings: true });
  } catch {}
  // Firestore
  try {
    connectFirestoreEmulator(db, EMU_HOST, EMU_FS_PORT);
  } catch {}
  // Storage
  try {
    connectStorageEmulator(storage, EMU_HOST, EMU_STORAGE_PORT);
  } catch {}
  // Functions
  try {
    connectFunctionsEmulator(functions, EMU_HOST, EMU_FN_PORT);
  } catch {}
}

// ---- Analytics (browser + prod + measurementId 존재 시) ----
let analytics: Analytics | undefined;
if (typeof window !== "undefined" && import.meta.env.PROD && firebaseConfig.measurementId) {
  // 지원 환경에서만 초기화
  isSupported()
    .then((ok) => {
      if (ok) analytics = getAnalytics(app);
    })
    .catch(() => {});
}

export { app, auth, db, storage, functions, analytics };
export default app;
