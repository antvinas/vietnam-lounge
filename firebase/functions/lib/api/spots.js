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
exports.spotsRouter = void 0;
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const node_cache_1 = __importDefault(require("node-cache"));
const router = express.Router();
const db = admin.firestore();
const recommendationCache = new node_cache_1.default({ stdTTL: 3600 }); // Cache for 1 hour
// GET /spots/detail?id=...
router.get('/detail', async (req, res) => {
    const { id } = req.query;
    if (!id) {
        return res.status(400).send({ error: 'Spot ID is required.' });
    }
    try {
        const spotDoc = await db.collection('spots').doc(id).get();
        if (!spotDoc.exists) {
            return res.status(404).send({ error: 'Spot not found.' });
        }
        // Atomically increment the view count
        await spotDoc.ref.update({ views: admin.firestore.FieldValue.increment(1) });
        res.status(200).send({ id: spotDoc.id, ...spotDoc.data() });
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to fetch spot detail.' });
    }
});
// GET /spots/recommendations?spotId=...
router.get('/recommendations', async (req, res) => {
    const { spotId } = req.query;
    if (!spotId) {
        return res.status(400).send({ error: 'Spot ID is required.' });
    }
    const cacheKey = `recommendations_${spotId}`;
    const cachedRecommendations = recommendationCache.get(cacheKey);
    if (cachedRecommendations) {
        return res.status(200).send(cachedRecommendations);
    }
    try {
        const spotDoc = await db.collection('spots').doc(spotId).get();
        if (!spotDoc.exists) {
            return res.status(404).send({ error: 'Original spot not found.' });
        }
        const originalSpot = spotDoc.data();
        if (!originalSpot) {
            return res.status(404).send({ error: 'Original spot data not found.' });
        }
        const { citySlug, category, id } = originalSpot;
        const recommendationsSnapshot = await db.collection('spots')
            .where('citySlug', '==', citySlug)
            .where('category', '==', category)
            .orderBy('views', 'desc')
            .limit(6) // Get top 5 + the original one
            .get();
        const recommendations = recommendationsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(spot => spot.id !== spotId) // Exclude the original spot
            .slice(0, 5); // Ensure we only have 5 recommendations
        recommendationCache.set(cacheKey, recommendations);
        res.status(200).send(recommendations);
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to fetch recommendations.' });
    }
});
// --- Add other spot-related endpoints here ---
// e.g., POST /spots/like
// e.g., GET /spots/admin/list
exports.spotsRouter = router;
//# sourceMappingURL=spots.js.map