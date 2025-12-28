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
exports.usersRouter = void 0;
// firebase/functions/src/api/users.ts
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const requireAuth_1 = require("../middlewares/requireAuth");
const router = express.Router();
const db = admin.firestore();
// GET /users/me
router.get('/me', requireAuth_1.requireAuth, async (req, res) => {
    const { uid } = req.user;
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).send({ error: 'User profile not found.' });
        }
        return res.status(200).send(Object.assign({ id: userDoc.id }, userDoc.data()));
    }
    catch (error) {
        return res.status(500).send({ error: 'Failed to fetch user profile.' });
    }
});
// PUT /users/me
router.put('/me', requireAuth_1.requireAuth, async (req, res) => {
    const { uid } = req.user;
    const { nickname, displayName, avatar, photoURL, bio } = req.body;
    const userProfile = {};
    if (nickname)
        userProfile.nickname = nickname;
    else if (displayName)
        userProfile.nickname = displayName;
    if (avatar)
        userProfile.avatar = avatar;
    else if (photoURL)
        userProfile.avatar = photoURL;
    if (bio !== undefined)
        userProfile.bio = bio;
    userProfile.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    if (Object.keys(userProfile).length <= 1) {
        return res.status(400).send({ error: 'No update data provided.' });
    }
    try {
        await db.collection('users').doc(uid).update(userProfile);
        const updated = await db.collection('users').doc(uid).get();
        return res.status(200).send(Object.assign({ message: "Profile updated successfully." }, updated.data()));
    }
    catch (error) {
        return res.status(500).send({ error: 'Failed to update profile.' });
    }
});
// DELETE /users/me
router.delete('/me', requireAuth_1.requireAuth, async (req, res) => {
    const { uid } = req.user;
    try {
        await db.collection('users').doc(uid).delete();
        await admin.auth().deleteUser(uid);
        return res.status(200).send({ message: "User deleted successfully." });
    }
    catch (error) {
        console.error("Delete user error:", error);
        return res.status(500).send({ error: 'Failed to delete user.' });
    }
});
// GET /users/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const userDoc = await db.collection('users').doc(id).get();
        if (!userDoc.exists) {
            return res.status(404).send({ error: 'User not found.' });
        }
        const data = userDoc.data();
        const publicProfile = {
            nickname: (data === null || data === void 0 ? void 0 : data.nickname) || (data === null || data === void 0 ? void 0 : data.displayName) || 'Unknown',
            avatar: (data === null || data === void 0 ? void 0 : data.avatar) || (data === null || data === void 0 ? void 0 : data.photoURL) || null,
            bio: (data === null || data === void 0 ? void 0 : data.bio) || '',
            role: (data === null || data === void 0 ? void 0 : data.role) || 'user',
        };
        return res.status(200).send(publicProfile);
    }
    catch (error) {
        return res.status(500).send({ error: 'Failed to fetch public profile.' });
    }
});
// GET /users/me/favorites
router.get('/me/favorites', requireAuth_1.requireAuth, async (req, res) => {
    const { uid } = req.user;
    try {
        const snapshot = await db.collection('users').doc(uid).collection('favorites')
            .orderBy('savedAt', 'desc')
            .get();
        const favorites = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        return res.status(200).send(favorites);
    }
    catch (error) {
        console.error("Get favorites error:", error);
        return res.status(500).send({ error: 'Failed to fetch favorites.' });
    }
});
// POST /users/me/favorites
router.post('/me/favorites', requireAuth_1.requireAuth, async (req, res) => {
    var _a, _b, _c;
    const { uid } = req.user;
    const { spotId } = req.body;
    if (!spotId)
        return res.status(400).send({ error: 'spotId is required' });
    try {
        const favRef = db.collection('users').doc(uid).collection('favorites').doc(spotId);
        const existing = await favRef.get();
        if (existing.exists) {
            return res.status(200).send({ message: "Already favorited." });
        }
        let spotDoc = await db.collection('spots').doc(spotId).get();
        let mode = 'explorer';
        if (!spotDoc.exists) {
            spotDoc = await db.collection('adult_spots').doc(spotId).get();
            mode = 'nightlife';
        }
        if (!spotDoc.exists) {
            return res.status(404).send({ error: 'Spot not found.' });
        }
        const spotData = spotDoc.data() || {};
        const favoriteData = {
            name: spotData.name || 'Unknown',
            category: spotData.category || '기타',
            address: spotData.address || ((_a = spotData.location) === null || _a === void 0 ? void 0 : _a.address) || '',
            thumbnail: Array.isArray(spotData.images) && spotData.images.length > 0 ? spotData.images[0] : null,
            rating: spotData.rating || 0,
            mode: mode,
            region: spotData.region || '',
            latitude: spotData.latitude || ((_b = spotData.location) === null || _b === void 0 ? void 0 : _b.lat) || null,
            longitude: spotData.longitude || ((_c = spotData.location) === null || _c === void 0 ? void 0 : _c.lng) || null,
            savedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await favRef.set(favoriteData);
        return res.status(201).send({ message: "Added to favorites.", data: favoriteData });
    }
    catch (error) {
        console.error("Add favorite error:", error);
        return res.status(500).send({ error: 'Failed to add favorite.' });
    }
});
// DELETE /users/me/favorites/:spotId
router.delete('/me/favorites/:spotId', requireAuth_1.requireAuth, async (req, res) => {
    const { uid } = req.user;
    const { spotId } = req.params;
    try {
        await db.collection('users').doc(uid).collection('favorites').doc(spotId).delete();
        return res.status(200).send({ message: "Removed from favorites." });
    }
    catch (error) {
        console.error("Remove favorite error:", error);
        return res.status(500).send({ error: 'Failed to remove favorite.' });
    }
});
exports.usersRouter = router;
//# sourceMappingURL=users.js.map