import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// =======================
// Firebase 기본 설정
// =======================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase 초기화
export const app = initializeApp(firebaseConfig);

// 서비스 인스턴스
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "asia-northeast3");

// =======================
// Emulator 설정
// =======================
// Vite 환경변수에 플래그를 둬서 에뮬레이터 ON/OFF 가능하게 함
// .env.local 등에 VITE_USE_FIREBASE_EMULATOR=true 로 넣으면 활성화
// 기본은 import.meta.env.DEV 일 때만 체크
/*
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true") {
  console.log("🔥 Firebase Emulator 연결 중...");

  try {
    // Auth Emulator
    connectAuthEmulator(auth, "http://localhost:9099");

    // Firestore Emulator
    connectFirestoreEmulator(db, "localhost", 8081);

    // Functions Emulator
    connectFunctionsEmulator(functions, "localhost", 5001);

    console.log("✅ Firebase Emulator 연결 성공");
  } catch (err) {
    console.error("❌ Firebase Emulator 연결 실패:", err);
  }
}
*/
