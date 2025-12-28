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
// ------------------------------------------------------------------
// 👤 User Profile Management
// ------------------------------------------------------------------
// GET /users/me (Get current user's profile)
router.get('/me', requireAuth_1.requireAuth, async (req, res) => {
    const { uid } = req.user;
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).send({ error: 'User profile not found.' });
        }
        res.status(200).send({ id: userDoc.id, ...userDoc.data() });
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to fetch user profile.' });
    }
});
// PUT /users/me (Update current user's profile)
router.put('/me', requireAuth_1.requireAuth, async (req, res) => {
    const { uid } = req.user;
    // 프론트엔드 필드명(nickname, avatar, bio)에 맞춰 매핑
    const { nickname, displayName, avatar, photoURL, bio } = req.body;
    const userProfile = {};
    // 닉네임 (nickname 우선, 없으면 displayName)
    if (nickname)
        userProfile.nickname = nickname;
    else if (displayName)
        userProfile.nickname = displayName;
    // 아바타 (avatar 우선, 없으면 photoURL)
    if (avatar)
        userProfile.avatar = avatar;
    else if (photoURL)
        userProfile.avatar = photoURL;
    if (bio !== undefined)
        userProfile.bio = bio;
    userProfile.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    if (Object.keys(userProfile).length <= 1) { // Only updatedAt is present
        return res.status(400).send({ error: 'No update data provided.' });
    }
    try {
        await db.collection('users').doc(uid).update(userProfile);
        // 최신 데이터 반환
        const updated = await db.collection('users').doc(uid).get();
        res.status(200).send({ message: "Profile updated successfully.", ...updated.data() });
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to update profile.' });
    }
});
// DELETE /users/me (회원 탈퇴)
router.delete('/me', requireAuth_1.requireAuth, async (req, res) => {
    const { uid } = req.user;
    try {
        // 1. DB 유저 문서 삭제
        await db.collection('users').doc(uid).delete();
        // 2. Auth 계정 삭제
        await admin.auth().deleteUser(uid);
        // 3. (선택) 하위 컬렉션(찜, 쿠폰 등) 삭제는 Cloud Functions Trigger(cleanup)에 위임하거나 여기서 배치 삭제
        res.status(200).send({ message: "User deleted successfully." });
    }
    catch (error) {
        console.error("Delete user error:", error);
        res.status(500).send({ error: 'Failed to delete user.' });
    }
});
// GET /users/:id (공개 프로필 조회 - 필요한 경우 사용)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const userDoc = await db.collection('users').doc(id).get();
        if (!userDoc.exists) {
            return res.status(404).send({ error: 'User not found.' });
        }
        const data = userDoc.data();
        const publicProfile = {
            nickname: data?.nickname || data?.displayName || 'Unknown',
            avatar: data?.avatar || data?.photoURL || null,
            bio: data?.bio || '',
            role: data?.role || 'user',
        };
        res.status(200).send(publicProfile);
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to fetch public profile.' });
    }
});
// ------------------------------------------------------------------
// ⭐ Favorites (찜하기) CRUD
// ------------------------------------------------------------------
// GET /users/me/favorites (찜 목록 조회)
router.get('/me/favorites', requireAuth_1.requireAuth, async (req, res) => {
    const { uid } = req.user;
    try {
        const snapshot = await db.collection('users').doc(uid).collection('favorites')
            .orderBy('savedAt', 'desc')
            .get();
        const favorites = snapshot.docs.map(doc => ({
            id: doc.id, // spotId
            ...doc.data()
        }));
        res.status(200).send(favorites);
    }
    catch (error) {
        console.error("Get favorites error:", error);
        res.status(500).send({ error: 'Failed to fetch favorites.' });
    }
});
// POST /users/me/favorites (찜 추가)
router.post('/me/favorites', requireAuth_1.requireAuth, async (req, res) => {
    const { uid } = req.user;
    const { spotId } = req.body;
    if (!spotId)
        return res.status(400).send({ error: 'spotId is required' });
    try {
        const favRef = db.collection('users').doc(uid).collection('favorites').doc(spotId);
        // 이미 찜한 경우 성공 처리 (Idempotent)
        const existing = await favRef.get();
        if (existing.exists) {
            return res.status(200).send({ message: "Already favorited." });
        }
        // 스팟 정보 가져오기 (Snapshot 저장용)
        // 1. spots (explorer) 확인
        let spotDoc = await db.collection('spots').doc(spotId).get();
        let mode = 'explorer';
        // 2. 없으면 adult_spots (nightlife) 확인
        if (!spotDoc.exists) {
            spotDoc = await db.collection('adult_spots').doc(spotId).get();
            mode = 'nightlife';
        }
        if (!spotDoc.exists) {
            return res.status(404).send({ error: 'Spot not found.' });
        }
        const spotData = spotDoc.data() || {};
        // 🚀 핵심: 필요한 정보만 추려서 스냅샷 저장 (마이페이지 조회 성능 최적화)
        const favoriteData = {
            name: spotData.name || 'Unknown',
            category: spotData.category || '기타',
            address: spotData.address || spotData.location?.address || '',
            // 이미지가 있으면 첫 번째 것 사용
            thumbnail: Array.isArray(spotData.images) && spotData.images.length > 0 ? spotData.images[0] : null,
            rating: spotData.rating || 0,
            mode: mode,
            region: spotData.region || '',
            // 좌표 정보도 저장해두면 지도 표시에 유리
            latitude: spotData.latitude || spotData.location?.lat || null,
            longitude: spotData.longitude || spotData.location?.lng || null,
            savedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await favRef.set(favoriteData);
        res.status(201).send({ message: "Added to favorites.", data: favoriteData });
    }
    catch (error) {
        console.error("Add favorite error:", error);
        res.status(500).send({ error: 'Failed to add favorite.' });
    }
});
// DELETE /users/me/favorites/:spotId (찜 삭제)
router.delete('/me/favorites/:spotId', requireAuth_1.requireAuth, async (req, res) => {
    const { uid } = req.user;
    const { spotId } = req.params;
    try {
        await db.collection('users').doc(uid).collection('favorites').doc(spotId).delete();
        res.status(200).send({ message: "Removed from favorites." });
    }
    catch (error) {
        console.error("Remove favorite error:", error);
        res.status(500).send({ error: 'Failed to remove favorite.' });
    }
});
exports.usersRouter = router;
//# sourceMappingURL=users.js.map