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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = void 0;
const AWS = __importStar(require("aws-sdk"));
const uuid_1 = require("uuid");
// A simple flag to check if we are in a production environment
const isProduction = process.env.NODE_ENV === 'production';
class UploadsService {
    constructor() {
        this.s3 = null;
        // Only initialize S3 in a production environment
        if (isProduction) {
            if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION || !process.env.S3_BUCKET_NAME) {
                console.warn('AWS S3 environment variables are not fully configured for production.');
                // In production, we might want to throw an error to prevent the app from starting
                // throw new Error('S3 environment variables are not set for production');
            }
            else {
                this.s3 = new AWS.S3({
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                    region: process.env.AWS_REGION,
                    signatureVersion: 'v4',
                });
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
    async createPresignedUrl(fileType, directory = 'uploads') {
        const key = `${directory}/${(0, uuid_1.v4)()}.${this.getFileExtension(fileType)}`;
        // If not in production (or S3 is not available), return a dummy URL for local development
        if (!isProduction || !this.s3) {
            console.log(`[DEV MODE] Generated dummy presigned URL for key: ${key}`);
            return {
                uploadUrl: `http://localhost:9199/uploads/dummy-url-for/${key}`,
                key: key
            };
        }
        const bucketName = process.env.S3_BUCKET_NAME;
        if (!bucketName) {
            throw new Error('S3_BUCKET_NAME environment variable is not set.');
        }
        const params = {
            Bucket: bucketName,
            Key: key,
            ContentType: fileType,
            Expires: 60 * 5, // URL expires in 5 minutes
        };
        const uploadUrl = await this.s3.getSignedUrlPromise('putObject', params);
        return { uploadUrl, key };
    }
    getFileExtension(fileType) {
        switch (fileType) {
            case 'image/jpeg': return 'jpg';
            case 'image/png': return 'png';
            case 'image/gif': return 'gif';
            default: return 'bin';
        }
    }
}
exports.UploadsService = UploadsService;
//# sourceMappingURL=Uploads.service.js.map