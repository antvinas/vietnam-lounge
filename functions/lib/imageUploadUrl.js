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
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUpload = void 0;
const functions = __importStar(require("firebase-functions"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3 = new client_s3_1.S3Client({ region: process.env.AWS_REGION || "ap-southeast-1" });
exports.signUpload = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "Login first");
    const key = `spots/${context.auth.uid}/${Date.now()}-${data.filename}`;
    const cmd = new client_s3_1.PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        ContentType: data.contentType || "image/jpeg",
        ACL: "public-read"
    });
    const url = await (0, s3_request_presigner_1.getSignedUrl)(s3, cmd, { expiresIn: 60 });
    const cdn = (process.env.CLOUDFRONT_URL || "").replace(/\/$/, "");
    return { url, key, cdnUrl: cdn ? `${cdn}/${key}` : null };
});
