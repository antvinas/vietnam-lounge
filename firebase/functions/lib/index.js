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
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https"); // ✅ v2 API
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// import { spotsRouter } from './api/spots'; // 라우터 기능을 잠시 비활성화합니다.
const community_1 = require("./api/community");
// Emulator 환경 강제 설정
if (process.env.FUNCTIONS_EMULATOR === 'true') {
    console.log('EMULATOR DETECTED: Forcing FIRESTORE_EMULATOR_HOST environment variable.');
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081';
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
app.use('/community', community_1.communityRouter);
// ✅ v2 API export
exports.api = (0, https_1.onRequest)({ region: 'asia-northeast3' }, // 기존 functions.region() 대체
app);
//# sourceMappingURL=index.js.map