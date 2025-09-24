import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'asia-northeast3');

// 개발 모드이고, Vite에 의해 코드가 실행될 때 에뮬레이터에 연결합니다.
if (import.meta.env.DEV) {
  console.log('Development mode: Connecting to Firebase emulators.');

  // Auth 에뮬레이터
  connectAuthEmulator(auth, 'http://localhost:9099');

  // Firestore 에뮬레이터
  connectFirestoreEmulator(db, 'localhost', 8081);

  // Functions 에뮬레이터
  connectFunctionsEmulator(functions, 'localhost', 5001);
}
