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
exports.api = void 0;
// firebase/functions/src/index.ts
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const community_1 = require("./api/community");
const functions = __importStar(require("firebase-functions"));
let initializationError = null;
let app = null;
try {
    console.log("--- [INIT START] Initializing function... ---");
    // ✅ Firebase Admin SDK 초기화 (Production 전용)
    if (!admin.apps.length) {
        admin.initializeApp();
    }
    console.log("[INIT] Firebase Admin SDK initialized successfully.");
    // ✅ Express 앱 생성
    app = (0, express_1.default)();
    app.use((0, cors_1.default)({ origin: true }));
    // ✅ Firebase Auth 미들웨어
    app.use(async (req, res, next) => {
        const idToken = req.headers.authorization?.split("Bearer ")[1];
        if (idToken) {
            try {
                const decodedToken = await admin.auth().verifyIdToken(idToken);
                req.user = decodedToken;
            }
            catch {
                // invalid token은 무시
            }
        }
        next();
    });
    // ✅ 라우터 등록
    app.use("/community", community_1.communityRouter);
    console.log("--- [INIT SUCCESS] Initialization complete. ---");
}
catch (error) {
    initializationError = error;
    console.error("🔥 [CRITICAL INITIALIZATION ERROR]", initializationError);
    functions.logger.error("🔥 [CRITICAL INITIALIZATION ERROR]", initializationError);
}
// ✅ Firebase Functions Export (Production Only)
exports.api = (0, https_1.onRequest)({ region: "asia-northeast3" }, (req, res) => {
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
    }
    else {
        functions.logger.error("CRITICAL: Express app is not initialized.");
        res.status(500).send({ error: "CRITICAL: Express app is not initialized." });
    }
});
//# sourceMappingURL=index.js.map