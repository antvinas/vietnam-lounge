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
exports.onSpotWrite = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const typesense_1 = __importDefault(require("typesense"));
if (!admin.apps.length)
    admin.initializeApp();
const client = new typesense_1.default.Client({
    nodes: [{
            host: process.env.TYPESENSE_HOST || "",
            port: Number(process.env.TYPESENSE_PORT || 443),
            protocol: process.env.TYPESENSE_PROTOCOL || "https"
        }],
    apiKey: process.env.TYPESENSE_ADMIN_KEY || "",
    connectionTimeoutSeconds: 5
});
const COLLECTION = process.env.TYPESENSE_COLLECTION || "spots";
exports.onSpotWrite = functions.firestore
    .document("spots/{id}")
    .onWrite(async (change, context) => {
    const id = context.params.id;
    if (!change.after.exists) {
        try {
            await client.collections(COLLECTION).documents(id).delete();
        }
        catch { }
        return;
    }
    const data = change.after.data();
    if (data.published !== true)
        return;
    const doc = {
        id,
        name: data.name,
        city: data.city,
        category: data.category,
        rating: data.rating ?? 0,
        geo_lat: data.location?.latitude ?? null,
        geo_lng: data.location?.longitude ?? null,
        reviewCount: data.reviewCount ?? 0
    };
    await client.collections(COLLECTION).documents().upsert(doc);
});
