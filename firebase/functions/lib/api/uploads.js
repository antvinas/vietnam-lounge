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
exports.uploadsRouter = void 0;
const express = __importStar(require("express"));
const requireAuth_1 = require("../middlewares/requireAuth");
const Uploads_service_1 = require("../services/uploads/Uploads.service");
const router = express.Router();
const uploadsService = Uploads_service_1.UploadsService.getInstance();
/**
 * POST /uploads/presigned-url
 *
 * Creates a presigned URL for a client to upload a file directly to S3.
 * The client must provide the file's MIME type in the request body.
 *
 * Request Body:
 *  {
 *    "fileType": "image/jpeg",
 *    "directory": "profile-pictures" // Optional: specify a directory
 *  }
 *
 * Response:
 *  {
 *    "uploadUrl": "https://<bucket-name>.s3.<region>.amazonaws.com/...?...".
 *    "key": "<directory>/<uuid>.<ext>"
 *  }
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
        res.status(500).send({ error: 'Failed to create presigned URL.' });
    }
});
exports.uploadsRouter = router;
//# sourceMappingURL=uploads.js.map