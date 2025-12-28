// firebase/functions/src/index.ts
import * as functions from "firebase-functions";
import express = require("express");
import cors = require("cors");
import * as admin from "firebase-admin";

// ✅ Admin SDK initialize (필수)
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Routers
import spotsRouter from "./api/spots";
import adminRouter from "./api/admin";

// 아래 라우터들은 네 프로젝트 export 방식에 맞춰 유지
import { eventsRouter } from "./api/events";
import { reviewsRouter } from "./api/reviews";
import { usersRouter } from "./api/users";
import { uploadsRouter } from "./api/uploads";

// ✅ (추가) Admin - Events 전용 라우터
// - GET /admin/events/:id/audit 같은 엔드포인트를 여기서 "확실히" 살림
// - 파일 위치: firebase/functions/src/api/admin/events.router.ts
import adminEventsRouter from "./api/admin/events.router";

// ✅ Callables (Cloud Functions callable)
export { setRole } from "./callables/setRole";

// Trigger Imports
import { onReviewWrite } from "./triggers/reviews";
import { dailyCronJob } from "./triggers/cron";
import { onUserCreated, onUserDeleted } from "./triggers/auth";

const app = express();

app.use(cors({ origin: true }));

// ✅ payload 커져도 안전하게 (운영 중 413 방지)
app.use(express.json({ limit: "10mb" }));

// ✅ 라우터 등록 (기본)
// (중요) /admin/events 처럼 더 구체적인 경로는 /admin 보다 먼저 등록하는 게 안전함
app.use("/spots", spotsRouter);

// ✅ Admin Events (전용)
app.use("/admin/events", adminEventsRouter);

// ✅ Admin (기존)
app.use("/admin", adminRouter);

// Public APIs
app.use("/events", eventsRouter);
app.use("/reviews", reviewsRouter);
app.use("/users", usersRouter);
app.use("/uploads", uploadsRouter);

// ✅ 라우터 등록 (/api prefix 지원: Hosting rewrite가 path를 보존하는 경우 대비)
app.use("/api/spots", spotsRouter);

// ✅ Admin Events (전용)
app.use("/api/admin/events", adminEventsRouter);

// ✅ Admin (기존)
app.use("/api/admin", adminRouter);

// Public APIs
app.use("/api/events", eventsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/users", usersRouter);
app.use("/api/uploads", uploadsRouter);

// Health Check
app.get("/health", (_req: express.Request, res: express.Response) => {
  res.send({ status: "ok", timestamp: new Date().toISOString() });
});
app.get("/api/health", (_req: express.Request, res: express.Response) => {
  res.send({ status: "ok", timestamp: new Date().toISOString() });
});

export const api = functions.https.onRequest(app);

export { onReviewWrite, dailyCronJob, onUserCreated, onUserDeleted };
