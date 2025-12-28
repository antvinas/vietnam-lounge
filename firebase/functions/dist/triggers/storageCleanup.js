"use strict";
// firebase/functions/src/triggers/storageCleanup.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageCleanup = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const Uploads_service_1 = require("../services/uploads/Uploads.service");
const db = admin.firestore();
const uploadsService = Uploads_service_1.UploadsService.getInstance();
/**
 * 매일 자정(또는 지정된 시간)에 실행되는 스토리지 청소 작업
 * 1. Firestore의 모든 'spots', 'adult_spots' 문서를 스캔하여 사용 중인 이미지 URL 수집
 * 2. S3의 'spots/' 디렉토리 파일 목록 조회
 * 3. DB에 없는 S3 파일(고아 파일) 삭제
 * * 주의: 데이터 양이 많아지면 메모리 문제나 타임아웃이 발생할 수 있으므로,
 * 추후에는 배치(Batch) 처리나 Cloud Tasks로 분산 처리해야 합니다.
 */
exports.storageCleanup = functions.pubsub
    .schedule('every 24 hours') // 실행 주기: 매 24시간
    .timeZone('Asia/Seoul') // 한국 시간 기준
    .onRun(async (context) => {
    console.log('[StorageCleanup] Starting orphan file cleanup...');
    try {
        // 1. DB에서 사용 중인 이미지 URL 수집 (Set으로 중복 제거 및 빠른 조회)
        const usedImageKeys = new Set();
        // (1) Spots 컬렉션 스캔
        const spotsSnap = await db.collection('spots').get();
        spotsSnap.forEach(doc => {
            const data = doc.data();
            if (Array.isArray(data.images)) {
                data.images.forEach((url) => usedImageKeys.add(extractKeyFromUrl(url)));
            }
            if (Array.isArray(data.menuImages)) {
                data.menuImages.forEach((url) => usedImageKeys.add(extractKeyFromUrl(url)));
            }
        });
        // (2) Adult Spots 컬렉션 스캔
        const adultSnap = await db.collection('adult_spots').get();
        adultSnap.forEach(doc => {
            const data = doc.data();
            if (Array.isArray(data.images)) {
                data.images.forEach((url) => usedImageKeys.add(extractKeyFromUrl(url)));
            }
            if (Array.isArray(data.menuImages)) {
                data.menuImages.forEach((url) => usedImageKeys.add(extractKeyFromUrl(url)));
            }
        });
        console.log(`[StorageCleanup] Found ${usedImageKeys.size} used images in Firestore.`);
        // 2. S3에서 실제 파일 목록 조회 (spots/ 폴더 기준)
        const s3Keys = await uploadsService.listObjects('spots/');
        console.log(`[StorageCleanup] Found ${s3Keys.length} objects in S3 (spots/ prefix).`);
        // 3. 비교 및 삭제 (Orphan 찾기)
        const orphanKeys = s3Keys.filter(key => !usedImageKeys.has(key));
        if (orphanKeys.length === 0) {
            console.log('[StorageCleanup] No orphan files found.');
            return;
        }
        console.log(`[StorageCleanup] Found ${orphanKeys.length} orphan files. Deleting...`);
        // 4. 고아 파일 삭제 (병렬 처리 제한)
        const DELETE_CONCURRENCY = 5;
        for (let i = 0; i < orphanKeys.length; i += DELETE_CONCURRENCY) {
            const batch = orphanKeys.slice(i, i + DELETE_CONCURRENCY);
            await Promise.all(batch.map(key => uploadsService.deleteFile(key)));
        }
        console.log('[StorageCleanup] Cleanup completed successfully.');
    }
    catch (error) {
        console.error('[StorageCleanup] Error during cleanup:', error);
    }
});
/**
 * URL에서 S3 Key를 추출하는 헬퍼 함수
 * (Uploads.service.ts의 로직과 일치해야 함)
 */
function extractKeyFromUrl(url) {
    if (!url)
        return '';
    try {
        // URL이 http로 시작하면 파싱 시도
        if (url.startsWith('http')) {
            const urlObj = new URL(url);
            // pathname 앞의 '/' 제거
            return urlObj.pathname.substring(1);
        }
        // URL이 아니면 키 자체로 간주
        return url;
    }
    catch (e) {
        return url;
    }
}
//# sourceMappingURL=storageCleanup.js.map