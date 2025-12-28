"use strict";
// firebase/functions/src/api/uploads.ts
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
const express = __importStar(require("express"));
const requireAuth_1 = require("../middlewares/requireAuth");
const Uploads_service_1 = require("../services/uploads/Uploads.service");
const router = express.Router();
const uploadsService = Uploads_service_1.UploadsService.getInstance();
/**
 * POST /uploads/presigned-url
 * S3 업로드를 위한 Presigned URL 발급
 */
router.post('/presigned-url', requireAuth_1.requireAuth, async (req, res) => {
    const { fileType, directory } = req.body;
    if (!fileType) {
        return res.status(400).send({ error: 'fileType is required.' });
    }
    try {
        const { uploadUrl, key } = await uploadsService.createPresignedUrl(fileType, directory);
        res.status(200).send({ uploadUrl, key });
    }
    catch (error) {
        console.error('Failed to create presigned URL:', error);
        res.status(500).send({ error: 'Failed to create upload URL.' });
    }
});
/**
 * 🔴 [추가] DELETE /uploads
 * S3 파일 삭제
 * Body: { key: string } 또는 { url: string }
 */
router.delete('/', requireAuth_1.requireAuth, async (req, res) => {
    const { key, url } = req.body;
    const target = key || url;
    if (!target) {
        return res.status(400).send({ error: 'Key or URL is required to delete file.' });
    }
    try {
        await uploadsService.deleteFile(target);
        res.status(200).send({ message: 'File deleted successfully' });
    }
    catch (error) {
        console.error('Failed to delete file:', error);
        res.status(500).send({ error: 'Failed to delete file.' });
    }
});
exports.default = router;
//# sourceMappingURL=uploads.js.map