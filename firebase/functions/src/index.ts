// functions/src/index.ts
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import express from "express";
import cors from "cors";

// ✅ 1. Admin 초기화 (가장 먼저 실행)
if (!admin.apps.length) {
  admin.initializeApp();
}

// ✅ 2. API 라우터 및 트리거 임포트
import { spotsRouter } from "./api/spots";
import { eventsRouter } from "./api/events";
import { reviewsRouter } from "./api/reviews";
import { usersRouter } from "./api/users";
import { adminRouter } from "./api/admin";
import { uploadsRouter } from "./api/uploads";

// [트리거] 리뷰 평점 자동 계산
import { onReviewWrite } from "./triggers/reviews";
// [트리거] 스팟 삭제 시 데이터 청소 (새로 추가됨)
import { onSpotDelete } from "./triggers/cleanup";

const app = express();

// ✅ 3. CORS 설정
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://vn-lounge.web.app",
  "https://vn-lounge.firebaseapp.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // origin이 없거나(서버 간 통신) 허용된 도메인이면 통과
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ 4. Body Parsers (용량 제한 설정)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// ✅ 5. Firebase Auth 미들웨어 (모든 요청에 대해 유저 정보 파싱)
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const idToken = authHeader.split("Bearer ")[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      (req as any).user = decodedToken;
    } catch (e) {
      // 토큰 검증 실패 시 로그만 남기고 통과 (개별 라우터에서 401 처리)
      logger.debug("Token verification failed", e);
    }
  }
  next();
});

// ✅ 6. 라우터 연결
const api = express.Router();

api.use("/spots", spotsRouter);
api.use("/events", eventsRouter);
api.use("/reviews", reviewsRouter);
api.use("/users", usersRouter);
api.use("/admin", adminRouter);
api.use("/uploads", uploadsRouter);

// 기본 경로에 API 라우터 마운트
app.use("/", api);

// ✅ 7. Export Functions (Firebase 배포 포인트)

// 7-1. API 서버 (HTTPS Request)
export const apiV1 = onRequest(app);

// 7-2. Firestore Triggers (Background Functions)

// 리뷰가 작성/삭제될 때 평점과 리뷰 수를 자동 업데이트
export const updateSpotRating = onReviewWrite;

// [추가됨] 스팟이 삭제될 때 하위 리뷰 데이터 자동 청소
export const cleanupSpotData = onSpotDelete;