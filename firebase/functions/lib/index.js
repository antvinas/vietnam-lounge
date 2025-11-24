"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const community_1 = require("./api/community");
/**
 * Firebase Functions Entry Point
 * - Node 20 호환
 * - CORS 허용 (localhost + 프로덕션 도메인)
 * - /api 경로 통합
 * - Firebase Auth Token 자동 검증
 */
let initializationError = null;
let expressApp = null;
try {
    console.log("--- [INIT START] Firebase Functions 초기화 ---");
    // ✅ Firebase Admin SDK 초기화
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    console.log("[INIT] Firebase Admin SDK initialized successfully.");
    // ✅ Express 앱 생성
    expressApp = (0, express_1.default)();
    // ✅ CORS 허용 (localhost + 배포 도메인)
    const allowedOrigins = [
        "http://localhost:5173",
        "https://vn-lounge.web.app",
        "https://vn-lounge.firebaseapp.com",
    ];
    expressApp.use((0, cors_1.default)({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                console.warn("❌ Blocked CORS origin:", origin);
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
    }));
    // ✅ Preflight OPTIONS 허용
    expressApp.options("*", (0, cors_1.default)());
    // ✅ Firebase Auth 미들웨어
    expressApp.use(async (req, res, next) => {
        const idToken = req.headers.authorization?.split("Bearer ")[1];
        if (idToken) {
            try {
                const decodedToken = await admin.auth().verifyIdToken(idToken);
                req.user = decodedToken;
            }
            catch {
                // invalid token 무시
            }
        }
        next();
    });
    // ✅ API 라우터 설정
    const apiRouter = express_1.default.Router();
    // 기존 커뮤니티 API 라우터 연결
    apiRouter.use("/community", community_1.communityRouter);
    // 테스트용 엔드포인트 (연결 확인용)
    apiRouter.get("/spots", (req, res) => {
        res.json([
            { id: "spot-001", name: "Firebase Spot Test A" },
            { id: "spot-002", name: "Firebase Spot Test B" },
        ]);
    });
    expressApp.use("/api", apiRouter);
    console.log("--- [INIT SUCCESS] Initialization complete. ---");
}
catch (error) {
    initializationError = error;
    console.error("🔥 [CRITICAL INITIALIZATION ERROR]", initializationError);
    functions.logger.error("🔥 [CRITICAL INITIALIZATION ERROR]", initializationError);
}
/**
 * ✅ Firebase Function Export
 * - Express 앱 래핑
 * - CORS / API 경로 / Auth 포함
 */
exports.app = (0, https_1.onRequest)({ region: "asia-northeast3" }, (req, res) => {
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
    if (expressApp) {
        expressApp(req, res);
    }
    else {
        functions.logger.error("CRITICAL: Express app is not initialized.");
        res.status(500).send({ error: "CRITICAL: Express app is not initialized." });
    }
});
//# sourceMappingURL=index.js.map