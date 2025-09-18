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
exports.api = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https"); // ✅ v2 API
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const spots_1 = require("./api/spots");
const community_1 = require("./api/community");
// Emulator 환경 강제 설정
if (process.env.FUNCTIONS_EMULATOR === 'true') {
    console.log('EMULATOR DETECTED: Forcing FIRESTORE_EMULATOR_HOST environment variable.');
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
}
// Firebase Admin 초기화 (한 번만)
if (!admin.apps.length) {
    admin.initializeApp();
}
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
// Firebase ID token decode 미들웨어
app.use(async (req, res, next) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
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
// 라우터 연결
app.use('/spots', spots_1.spotsRouter);
app.use('/community', community_1.communityRouter);
// ✅ v2 API export
exports.api = (0, https_1.onRequest)({ region: 'asia-northeast3' }, // 기존 functions.region() 대체
app);
//# sourceMappingURL=index.js.map