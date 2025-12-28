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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageCleanup = exports.onSpotDelete = exports.onReviewWrite = exports.app = void 0;
// firebase/functions/src/index.ts
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// ✅ 1. Admin 초기화 (앱이 없을 때만 초기화)
if (!admin.apps.length) {
    admin.initializeApp();
}
// ✅ 2. API 라우터 임포트
const spots_1 = require("./api/spots");
const events_1 = require("./api/events");
const reviews_1 = require("./api/reviews");
const users_1 = require("./api/users");
const admin_1 = require("./api/admin");
// 🔴 [수정] uploads.ts가 export default router 형식이므로 중괄호 제거
const uploads_1 = __importDefault(require("./api/uploads"));
// ✅ 3. Firestore 트리거 임포트
const reviews_2 = require("./triggers/reviews");
Object.defineProperty(exports, "onReviewWrite", { enumerable: true, get: function () { return reviews_2.onReviewWrite; } });
const cleanup_1 = require("./triggers/cleanup");
Object.defineProperty(exports, "onSpotDelete", { enumerable: true, get: function () { return cleanup_1.onSpotDelete; } });
const storageCleanup_1 = require("./triggers/storageCleanup"); // 🟢 [추가] 고아 파일 청소 스케줄러
Object.defineProperty(exports, "storageCleanup", { enumerable: true, get: function () { return storageCleanup_1.storageCleanup; } });
// ------------------------------------------------------------------
// 🚀 Express App 설정
// ------------------------------------------------------------------
const expressApp = (0, express_1.default)();
// CORS 설정 (모든 도메인 허용)
expressApp.use((0, cors_1.default)({ origin: true }));
// Body Parsers (용량 제한 설정)
expressApp.use(express_1.default.json({ limit: "10mb" }));
expressApp.use(express_1.default.urlencoded({ limit: "10mb", extended: true }));
// ✅ 4. Firebase Auth 미들웨어 (선택적 인증)
expressApp.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const idToken = authHeader.split("Bearer ")[1];
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            req.user = decodedToken;
        }
        catch (e) {
            console.debug("Token verification failed", e);
        }
    }
    next();
});
// ✅ 5. 라우터 연결
const api = express_1.default.Router();
api.use("/spots", spots_1.spotsRouter);
api.use("/events", events_1.eventsRouter);
api.use("/reviews", reviews_1.reviewsRouter);
api.use("/users", users_1.usersRouter);
api.use("/admin", admin_1.adminRouter);
api.use("/uploads", uploads_1.default); // 이미지 업로드/삭제 API 연결
// 헬스 체크
api.get("/", (req, res) => {
    res.status(200).send({ status: "ok", message: "VN Lounge API v1" });
});
// "/api" 경로 및 루트 경로 연결
expressApp.use("/api", api);
expressApp.use("/", api);
// 404 처리
expressApp.use((req, res) => {
    res.status(404).json({ error: "Endpoint not found", path: req.path });
});
// ------------------------------------------------------------------
// ✅ 6. Cloud Functions 배포
// ------------------------------------------------------------------
// API 서버 (region 설정: 서울 asia-northeast3)
exports.app = functions.region("asia-northeast3").https.onRequest(expressApp);
//# sourceMappingURL=index.js.map