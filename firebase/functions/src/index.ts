// firebase/functions/src/index.ts
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import { communityRouter } from "./api/community";
import * as functions from "firebase-functions";

let initializationError: Error | null = null;
let app: express.Express | null = null;

try {
  console.log("--- [INIT START] Initializing function... ---");

  // ✅ Firebase Admin SDK 초기화 (Production 전용)
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  console.log("[INIT] Firebase Admin SDK initialized successfully.");

  // ✅ Express 앱 생성
  app = express();
  app.use(cors({ origin: true }));

  // ✅ Firebase Auth 미들웨어
  app.use(async (req, res, next) => {
    const idToken = req.headers.authorization?.split("Bearer ")[1];
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

  // ✅ 라우터 등록
  app.use("/community", communityRouter);

  console.log("--- [INIT SUCCESS] Initialization complete. ---");

} catch (error) {
  initializationError = error as Error;
  console.error("🔥 [CRITICAL INITIALIZATION ERROR]", initializationError);
  functions.logger.error("🔥 [CRITICAL INITIALIZATION ERROR]", initializationError);
}

// ✅ Firebase Functions Export (Production Only)
export const api = onRequest({ region: "asia-northeast3" }, (req, res) => {
  if (initializationError) {
    functions.logger.error("Function failed to initialize.", {
      error: initializationError.message,
      stack: initializationError.stack,
    });
    res.status(500).send({
      error: "CRITICAL: Function failed to initialize.",
      details: initializationError.message,
    });
    return;
  }

  if (app) {
    app(req, res);
  } else {
    functions.logger.error("CRITICAL: Express app is not initialized.");
    res.status(500).send({ error: "CRITICAL: Express app is not initialized." });
  }
});
