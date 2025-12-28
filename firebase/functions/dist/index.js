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
exports.onUserDeleted = exports.onUserCreated = exports.dailyCronJob = exports.onReviewWrite = exports.api = exports.setRole = void 0;
// firebase/functions/src/index.ts
const functions = __importStar(require("firebase-functions"));
const express = require("express");
const cors = require("cors");
const admin = __importStar(require("firebase-admin"));
// ✅ Admin SDK initialize (필수)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
// Routers
const spots_1 = __importDefault(require("./api/spots"));
const admin_1 = __importDefault(require("./api/admin"));
// 아래 라우터들은 네 프로젝트 export 방식에 맞춰 유지
const events_1 = require("./api/events");
const reviews_1 = require("./api/reviews");
const users_1 = require("./api/users");
const uploads_1 = require("./api/uploads");
// ✅ (추가) Admin - Events 전용 라우터
// - GET /admin/events/:id/audit 같은 엔드포인트를 여기서 "확실히" 살림
// - 파일 위치: firebase/functions/src/api/admin/events.router.ts
const events_router_1 = __importDefault(require("./api/admin/events.router"));
// ✅ Callables (Cloud Functions callable)
var setRole_1 = require("./callables/setRole");
Object.defineProperty(exports, "setRole", { enumerable: true, get: function () { return setRole_1.setRole; } });
// Trigger Imports
const reviews_2 = require("./triggers/reviews");
Object.defineProperty(exports, "onReviewWrite", { enumerable: true, get: function () { return reviews_2.onReviewWrite; } });
const cron_1 = require("./triggers/cron");
Object.defineProperty(exports, "dailyCronJob", { enumerable: true, get: function () { return cron_1.dailyCronJob; } });
const auth_1 = require("./triggers/auth");
Object.defineProperty(exports, "onUserCreated", { enumerable: true, get: function () { return auth_1.onUserCreated; } });
Object.defineProperty(exports, "onUserDeleted", { enumerable: true, get: function () { return auth_1.onUserDeleted; } });
const app = express();
app.use(cors({ origin: true }));
// ✅ payload 커져도 안전하게 (운영 중 413 방지)
app.use(express.json({ limit: "10mb" }));
// ✅ 라우터 등록 (기본)
// (중요) /admin/events 처럼 더 구체적인 경로는 /admin 보다 먼저 등록하는 게 안전함
app.use("/spots", spots_1.default);
// ✅ Admin Events (전용)
app.use("/admin/events", events_router_1.default);
// ✅ Admin (기존)
app.use("/admin", admin_1.default);
// Public APIs
app.use("/events", events_1.eventsRouter);
app.use("/reviews", reviews_1.reviewsRouter);
app.use("/users", users_1.usersRouter);
app.use("/uploads", uploads_1.uploadsRouter);
// ✅ 라우터 등록 (/api prefix 지원: Hosting rewrite가 path를 보존하는 경우 대비)
app.use("/api/spots", spots_1.default);
// ✅ Admin Events (전용)
app.use("/api/admin/events", events_router_1.default);
// ✅ Admin (기존)
app.use("/api/admin", admin_1.default);
// Public APIs
app.use("/api/events", events_1.eventsRouter);
app.use("/api/reviews", reviews_1.reviewsRouter);
app.use("/api/users", users_1.usersRouter);
app.use("/api/uploads", uploads_1.uploadsRouter);
// Health Check
app.get("/health", (_req, res) => {
    res.send({ status: "ok", timestamp: new Date().toISOString() });
});
app.get("/api/health", (_req, res) => {
    res.send({ status: "ok", timestamp: new Date().toISOString() });
});
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map