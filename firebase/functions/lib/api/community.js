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
exports.communityRouter = void 0;
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const router = express.Router();
const getDb = () => admin.firestore();
// ✅ 인증 미들웨어 (Firebase Token 검증)
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).send({ success: false, error: "Unauthorized" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = await admin.auth().verifyIdToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error("Auth Error:", error);
        res.status(401).send({ success: false, error: "Invalid token" });
    }
};
// 🔥 컬렉션 매핑
const getCollectionName = (segment, type) => {
    return segment === "adult" ? `adult_${type}` : `community_${type}`;
};
// ✅ 게시글 상세 조회 (+ 조회수 증가)
router.get("/posts/:segment/:id", async (req, res) => {
    const { segment, id } = req.params;
    const collectionName = getCollectionName(segment, "posts");
    try {
        const postRef = getDb().collection(collectionName).doc(id);
        const postDoc = await postRef.get();
        if (!postDoc.exists)
            return res.status(404).send({ success: false, error: "Post not found" });
        // 조회수 증가
        await postRef.update({
            viewCount: admin.firestore.FieldValue.increment(1),
        });
        res.status(200).send({
            success: true,
            data: { id: postDoc.id, ...postDoc.data() },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: "Failed to fetch post" });
    }
});
// ✅ 게시글 목록 (카테고리/지역/정렬/페이지네이션)
router.get("/posts/:segment", async (req, res) => {
    const { segment } = req.params;
    const { category, region, sort = "latest", cursor = null, limit = 10 } = req.query;
    const collectionName = getCollectionName(segment, "posts");
    try {
        let query = getDb().collection(collectionName);
        if (category && category !== "all") {
            query = query.where("category", "==", category);
        }
        if (region && region !== "all") {
            query = query.where("region", "==", region);
        }
        if (sort === "latest")
            query = query.orderBy("createdAt", "desc");
        else if (sort === "hot")
            query = query.orderBy("likes", "desc");
        else if (sort === "comments")
            query = query.orderBy("commentsCount", "desc");
        else if (sort === "views")
            query = query.orderBy("viewCount", "desc");
        if (cursor) {
            const cursorDoc = await getDb().collection(collectionName).doc(cursor).get();
            if (cursorDoc.exists)
                query = query.startAfter(cursorDoc);
        }
        query = query.limit(Number(limit));
        const snapshot = await query.get();
        const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        const nextCursor = snapshot.docs.length === Number(limit)
            ? snapshot.docs[snapshot.docs.length - 1].id
            : null;
        res.status(200).send({ success: true, data: { items, nextCursor } });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: "Failed to fetch posts" });
    }
});
// ✅ 새 글 작성
router.post("/posts", requireAuth, async (req, res) => {
    const { title, content, category, segment, region, isNotice, isPinned } = req.body;
    const user = req.user;
    const collectionName = getCollectionName(segment, "posts");
    try {
        const now = admin.firestore.Timestamp.now();
        const newPost = {
            title,
            content,
            category,
            author: user?.name ?? "익명",
            authorId: user?.uid ?? "anonymous",
            avatar: user?.picture ?? "",
            region: region ?? "전체",
            likes: 0,
            commentsCount: 0,
            viewCount: 0,
            upVotes: 0,
            downVotes: 0,
            isNotice: isNotice ?? false,
            isPinned: isPinned ?? false,
            createdAt: now,
            updatedAt: now,
        };
        const addedPost = await getDb().collection(collectionName).add(newPost);
        res.status(201).send({ success: true, data: { id: addedPost.id, ...newPost } });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: "Failed to create post" });
    }
});
// ✅ 게시글 수정
router.put("/posts/:segment/:id", requireAuth, async (req, res) => {
    const { segment, id } = req.params;
    const collectionName = getCollectionName(segment, "posts");
    try {
        const now = admin.firestore.Timestamp.now();
        const updateData = { ...req.body, updatedAt: now };
        await getDb().collection(collectionName).doc(id).update(updateData);
        const updatedDoc = await getDb().collection(collectionName).doc(id).get();
        res.status(200).send({ success: true, data: { id: updatedDoc.id, ...updatedDoc.data() } });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: "Failed to update post" });
    }
});
// ✅ 댓글 목록
router.get("/posts/:segment/:postId/comments", async (req, res) => {
    const { segment, postId } = req.params;
    const collectionName = getCollectionName(segment, "comments");
    try {
        const commentsSnapshot = await getDb()
            .collection(collectionName)
            .where("postId", "==", postId)
            .orderBy("createdAt", "asc")
            .get();
        res.status(200).send({
            success: true,
            data: commentsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: "Failed to fetch comments" });
    }
});
// ✅ 댓글 작성 (+ 대댓글 지원 parentId)
router.post("/posts/:segment/:postId/comments", requireAuth, async (req, res) => {
    const { segment, postId } = req.params;
    const { content, parentId } = req.body;
    const user = req.user;
    const collectionName = getCollectionName(segment, "comments");
    try {
        const now = admin.firestore.Timestamp.now();
        const newComment = {
            postId,
            parentId: parentId ?? null,
            content,
            author: user?.name ?? "익명",
            authorId: user?.uid ?? "anonymous",
            avatar: user?.picture ?? "",
            createdAt: now,
        };
        const addedComment = await getDb().collection(collectionName).add(newComment);
        const postCollection = getCollectionName(segment, "posts");
        await getDb().collection(postCollection).doc(postId).update({
            commentsCount: admin.firestore.FieldValue.increment(1),
        });
        res.status(201).send({ success: true, data: { id: addedComment.id, ...newComment } });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: "Failed to create comment" });
    }
});
// ✅ 좋아요
router.post("/posts/:segment/:postId/like", requireAuth, async (req, res) => {
    const { segment, postId } = req.params;
    const collectionName = getCollectionName(segment, "posts");
    try {
        const postRef = getDb().collection(collectionName).doc(postId);
        await postRef.update({ likes: admin.firestore.FieldValue.increment(1) });
        const updated = await postRef.get();
        res.status(200).send({ success: true, data: updated.data() });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: "Failed to like post" });
    }
});
// ✅ 투표 (up/down)
router.post("/posts/:segment/:postId/vote", requireAuth, async (req, res) => {
    const { segment, postId } = req.params;
    const { value } = req.body;
    const collectionName = getCollectionName(segment, "posts");
    try {
        const postRef = getDb().collection(collectionName).doc(postId);
        if (value === 1) {
            await postRef.update({ upVotes: admin.firestore.FieldValue.increment(1) });
        }
        else if (value === -1) {
            await postRef.update({ downVotes: admin.firestore.FieldValue.increment(1) });
        }
        const updated = await postRef.get();
        res.status(200).send({ success: true, data: updated.data() });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: "Failed to vote on post" });
    }
});
// ✅ 카테고리 목록
router.get("/categories/:segment", async (req, res) => {
    const { segment } = req.params;
    const collectionName = getCollectionName(segment, "categories");
    try {
        const categoriesSnapshot = await getDb().collection(collectionName).get();
        res.status(200).send({
            success: true,
            data: categoriesSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ success: false, error: "Failed to fetch categories" });
    }
});
exports.communityRouter = router;
//# sourceMappingURL=community.js.map