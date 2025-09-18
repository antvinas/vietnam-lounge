import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https'; // ✅ v2 API
import express from 'express';
import cors from 'cors';
import { spotsRouter } from './api/spots';
import { communityRouter } from './api/community';

// Emulator 환경 강제 설정
if (process.env.FUNCTIONS_EMULATOR === 'true') {
  console.log('EMULATOR DETECTED: Forcing FIRESTORE_EMULATOR_HOST environment variable.');
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
}

// Firebase Admin 초기화 (한 번만)
if (!admin.apps.length) {
  admin.initializeApp();
}

const app = express();
app.use(cors({ origin: true }));

// Firebase ID token decode 미들웨어
app.use(async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  if (idToken) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      (req as any).user = decodedToken;
    } catch {
      // invalid token은 무시
    }
  }
  next();
});

// 라우터 연결
app.use('/spots', spotsRouter);
app.use('/community', communityRouter);

// ✅ v2 API export
export const api = onRequest(
  { region: 'asia-northeast3' }, // 기존 functions.region() 대체
  app
);
