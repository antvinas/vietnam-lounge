// src/lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

/**
 * 환경변수에서 Firebase 설정을 읽어 초기화합니다.
 * - .env / .env.production 에 값을 넣어 두세요.
 * - measurementId(GA4)는 선택이지만 있으면 애널리틱스가 활성화됩니다.
 */
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    // 콘솔에 firebasestorage.app 로 보일 때가 있는데 실제 버킷 도메인은 appspot.com 입니다.
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || "vietnam-lounge.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
    // 선택: GA4 Measurement ID (예: G-9YM6EHPQE3)
    measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined,
};

// 이미 초기화된 앱이 있으면 재사용
const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

// Firebase 서비스 export
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * 애널리틱스는 브라우저 환경에서만 동작하므로 isSupported()로 안전하게 체크.
 * 사용 예) (await analyticsPromise)?.logEvent('page_view')
 */
export const analyticsPromise = isSupported().then((ok) =>
    ok ? getAnalytics(app) : null
);
