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
exports.sitemap = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sitemap_1 = require("sitemap");
if (!admin.apps.length)
    admin.initializeApp();
exports.sitemap = functions.https.onRequest(async (_req, res) => {
    const db = admin.firestore();
    const spots = await db.collection("spots").where("published", "==", true).limit(5000).get();
    const smStream = new sitemap_1.SitemapStream({ hostname: "https://YOUR_DOMAIN" });
    spots.forEach(doc => {
        const data = doc.data();
        smStream.write({
            url: `/spots/${doc.id}`,
            changefreq: "daily",
            priority: 0.7,
            lastmod: (data.updatedAt?.toDate?.() ?? new Date())
        });
    });
    smStream.end();
    const xml = await (0, sitemap_1.streamToPromise)(smStream);
    res.set("Content-Type", "application/xml");
    res.status(200).send(xml.toString());
});
