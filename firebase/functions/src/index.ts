// functions/src/index.ts
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";

import { communityRouter } from "./api/community";
import { spotsRouter } from "./api/spots";

// ---- Admin 초기화 ----
if (!admin.apps.length) {
  admin.initializeApp();
}

// ---- Express 앱 구성 ----
const app = express();

// CORS: 기본 허용 + 환경변수 추가 허용
const defaultAllowed = new Set<string>([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://vn-lounge.web.app",
  "https://vn-lounge.firebaseapp.com",
]);

const envAllowed = (process.env.CORS_ALLOW_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

for (const o of envAllowed) defaultAllowed.add(o);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (defaultAllowed.has(origin)) return callback(null, true);
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.options("*", cors());

// Body parsers
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ limit: "2mb", extended: true }));

// ---- Firebase Auth → req.user ----
app.use(async (req, _res, next) => {
  const idToken = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (idToken) {
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      (req as any).user = decoded;
    } catch {
      // 토큰 오류는 무시(익명 접근 가능 라우트 대비)
    }
  }
  next();
});

// ---- Health ----
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

// ---- API 라우트 ----
// 최종 URL: https://<region>-<project>.cloudfunctions.net/app/api/...
const api = express.Router();
api.use("/community", communityRouter);
api.use("/spots", spotsRouter);

// (필요 시) api.get("/spots/search", ...) 를 spotsRouter 내부에서 처리하도록 유지
app.use("/api", api);

// ---- 404 ----
app.use((_req, res) => res.status(404).json({ error: "NOT_FOUND" }));

// ---- Export (함수 이름은 'app' 유지) ----
export const app = onRequest({ region: "asia-northeast3" }, (req, res) => {
  return app(req, res);
});
