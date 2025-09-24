import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https'; // ✅ v2 API
import express from 'express';
import cors from 'cors';
// import { spotsRouter } from './api/spots'; // 라우터 기능을 잠시 비활성화합니다.
import { communityRouter } from './api/community';

// Emulator 환경 강제 설정
if (process.env.FUNCTIONS_EMULATOR === 'true') {
  console.log('EMULATOR DETECTED: Forcing FIRESTORE_EMULATOR_HOST environment variable.');
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081';
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

// --- 진단용 테스트 API ---
// 프론트엔드의 /api/spots 요청이 이곳으로 오는지 확인합니다.
app.get('/spots', (req, res) => {
  console.log('✅✅✅ /spots 테스트 API가 성공적으로 호출되었습니다! ✅✅✅');
  res.status(200).json([
    { id: 'test-spot-1', name: '테스트 스팟 1: 연결 성공' },
    { id: 'test-spot-2', name: '테스트 스팟 2: 라우터가 문제였습니다.' },
  ]);
});

// 기존 라우터를 잠시 비활성화합니다.
// app.use('/spots', spotsRouter); 
app.use('/community', communityRouter);

// ✅ v2 API export
export const api = onRequest(
  { region: 'asia-northeast3' }, // 기존 functions.region() 대체
  app
);
