// functions/src/lib/firebase.ts
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  // Cloud Functions 환경에선 기본 자격증명으로 초기화
  admin.initializeApp();
}

export const db = admin.firestore();
export const FieldPath = admin.firestore.FieldPath;
export type Timestamp = admin.firestore.Timestamp;
