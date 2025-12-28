"use strict";
// firebase/functions/src/services/uploads/Uploads.service.ts
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
exports.UploadsService = void 0;
const AWS = __importStar(require("aws-sdk"));
const crypto_1 = require("crypto");
// A simple flag to check if we are in a production environment
const isProduction = process.env.NODE_ENV === 'production';
class UploadsService {
    constructor() {
        this.s3 = null;
        // Only initialize S3 in a production environment
        // (Dev 모드에서도 테스트하려면 조건을 완화하거나 로컬 S3 Mock을 사용해야 함)
        // 🔴 [수정] 아래 줄 오타 수정됨 (FORCE_S3_USAGE)
        if (isProduction || process.env.FORCE_S3_USAGE === 'true') {
            if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION || !process.env.S3_BUCKET_NAME) {
                console.warn('AWS S3 environment variables are not fully configured.');
            }
            else {
                this.s3 = new AWS.S3({
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                    region: process.env.AWS_REGION,
                    signatureVersion: 'v4',
                });
                this.bucketName = process.env.S3_BUCKET_NAME;
            }
        }
        else {
            console.log('S3 Service is in development mode. AWS S3 will not be initialized.');
        }
    }
    static getInstance() {
        if (!UploadsService.instance) {
            UploadsService.instance = new UploadsService();
        }
        return UploadsService.instance;
    }
    getFileExtension(contentType) {
        const types = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
        };
        return types[contentType] || 'jpg';
    }
    /**
     * Presigned URL 생성 (업로드용)
     */
    async createPresignedUrl(fileType, directory = 'uploads') {
        const key = `${directory}/${(0, crypto_1.randomUUID)()}.${this.getFileExtension(fileType)}`;
        // Dev 모드 처리
        if (!this.s3 || !this.bucketName) {
            console.log(`[DEV MODE] Generated dummy presigned URL for key: ${key}`);
            return {
                uploadUrl: `http://localhost:9199/uploads/dummy-url-for/${key}`,
                key: key
            };
        }
        const params = {
            Bucket: this.bucketName,
            Key: key,
            ContentType: fileType,
            Expires: 60 * 5, // 5분
        };
        const uploadUrl = await this.s3.getSignedUrlPromise('putObject', params);
        return { uploadUrl, key };
    }
    /**
     * S3 파일 삭제
     * @param keyOrUrl S3 Key 값 또는 전체 URL
     */
    async deleteFile(keyOrUrl) {
        if (!this.s3 || !this.bucketName) {
            console.log(`[DEV MODE] Skipping deletion for: ${keyOrUrl}`);
            return;
        }
        // URL인 경우 Key 추출 (간단한 파싱)
        let key = keyOrUrl;
        if (keyOrUrl.startsWith('http')) {
            try {
                const urlObj = new URL(keyOrUrl);
                // pathname의 첫 번째 '/' 제거 (예: /bucket/key -> bucket/key or /key -> key)
                key = urlObj.pathname.substring(1);
            }
            catch (e) {
                console.warn('Failed to parse URL, using as key:', keyOrUrl);
            }
        }
        const params = {
            Bucket: this.bucketName,
            Key: key,
        };
        try {
            await this.s3.deleteObject(params).promise();
            console.log(`Successfully deleted file from S3: ${key}`);
        }
        catch (error) {
            console.error(`Error deleting file from S3 (${key}):`, error);
            throw error;
        }
    }
    /**
     * S3 파일 목록 조회 (Cron 정리 작업용)
     * @param prefix 조회할 폴더 경로 (예: 'spots/')
     */
    async listObjects(prefix = '') {
        if (!this.s3 || !this.bucketName) {
            return [];
        }
        let keys = [];
        let continuationToken = undefined;
        try {
            do {
                const params = {
                    Bucket: this.bucketName,
                    Prefix: prefix,
                    ContinuationToken: continuationToken,
                };
                const data = await this.s3.listObjectsV2(params).promise();
                if (data.Contents) {
                    const fetchedKeys = data.Contents.map(obj => obj.Key).filter((k) => !!k);
                    keys = keys.concat(fetchedKeys);
                }
                continuationToken = data.NextContinuationToken;
            } while (continuationToken);
            return keys;
        }
        catch (error) {
            console.error('Error listing objects from S3:', error);
            throw error;
        }
    }
}
exports.UploadsService = UploadsService;
//# sourceMappingURL=Uploads.service.js.map