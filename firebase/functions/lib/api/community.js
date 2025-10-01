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
// Middleware (추후 실제 인증 미들웨어로 교체 가능)
const requireAuth = (req, res, next) => {
    // TODO: 인증 로직 추가
    next();
};
// 🔥 헬퍼: 컬렉션 이름 매핑
const getCollectionName = (segment, type) => {
    if (segment === "adult") {
        return `adult_${type}`;
    }
    return `community_${type}`;
};
// ✅ 게시글 상세 조회
router.get("/posts/:segment/:id", requireAuth, async (req, res) => {
    const { segment, id } = req.params;
    const collectionName = getCollectionName(segment, "posts");
    try {
        const postDoc = await getDb().collection(collectionName).doc(id).get();
        if (!postDoc.exists)
            return res.status(404).send({ error: "Post not found." });
        res.status(200).send({ id: postDoc.id, ...postDoc.data() });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch post." });
    }
});
// ✅ 게시글 목록 (카테고리/지역/정렬/페이지네이션)
router.get("/posts/:segment", requireAuth, async (req, res) => {
    console.log("--- [START] GET /posts/:segment ---");
    const { segment } = req.params;
    const { category, region, sort = "latest", cursor = null, limit = 10 } = req.query;
    console.log(`Params: segment=${segment}`);
    console.log(`Query: category=${category}, region=${region}, sort=${sort}, cursor=${cursor}, limit=${limit}`);
    const collectionName = getCollectionName(segment, "posts");
    console.log(`Using collection: ${collectionName}`);
    try {
        console.log("Building Firestore query...");
        let query = getDb().collection(collectionName);
        if (category && category !== "전체" && category !== "all") {
            console.log(`Applying category filter: ${category}`);
            query = query.where("category", "==", category);
        }
        if (region && region !== "전체 지역" && region !== "all") {
            console.log(`Applying region filter: ${region}`);
            query = query.where("region", "==", region);
        }
        if (sort === "latest") {
            console.log("Applying sort order: createdAt desc");
            query = query.orderBy("createdAt", "desc");
        }
        else if (sort === "hot") {
            console.log("Applying sort order: likes desc");
            query = query.orderBy("likes", "desc");
        }
        if (cursor) {
            console.log(`Applying cursor: ${cursor}`);
            const cursorDoc = await getDb().collection(collectionName).doc(cursor).get();
            if (cursorDoc.exists) {
                console.log("Cursor doc found, applying startAfter.");
                query = query.startAfter(cursorDoc);
            }
            else {
                console.log("Cursor doc not found.");
            }
        }
        console.log(`Applying limit: ${limit}`);
        query = query.limit(Number(limit));
        console.log("Executing query.get()...");
        const snapshot = await query.get();
        console.log(`Query successful, received ${snapshot.docs.length} documents.`);
        const items = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        const nextCursor = snapshot.docs.length === Number(limit)
            ? snapshot.docs[snapshot.docs.length - 1].id
            : null;
        console.log(`Next cursor: ${nextCursor}`);
        console.log("--- [SUCCESS] Finished, sending response. ---");
        res.status(200).send({ items, nextCursor });
    }
    catch (error) {
        console.error("🔥🔥🔥 [CRITICAL ERROR] in GET /posts/:segment 🔥🔥🔥");
        console.error("Request Params:", req.params);
        console.error("Request Query:", req.query);
        console.error("Caught Error Object:", error);
        res.status(500).send({ error: `Failed to fetch ${segment} posts. Details logged.` });
    }
});
// ✅ 새 글 작성
router.post("/posts", requireAuth, async (req, res) => {
    const { title, content, category, segment } = req.body;
    const collectionName = getCollectionName(segment, "posts");
    try {
        const now = admin.firestore.Timestamp.now();
        const newPost = {
            title,
            content,
            category,
            author: req.user?.displayName ?? "익명",
            authorId: req.user?.uid ?? "anonymous",
            avatar: "",
            region: req.body.region ?? "전체",
            likes: 0,
            commentsCount: 0,
            viewCount: 0,
            upVotes: 0,
            downVotes: 0,
            isNotice: req.body.isNotice ?? false,
            isPinned: req.body.isPinned ?? false,
            createdAt: now,
            updatedAt: now,
        };
        const addedPost = await getDb().collection(collectionName).add(newPost);
        res.status(201).send({ id: addedPost.id, ...newPost });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to create post." });
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
        res.status(200).send({ id: updatedDoc.id, ...updatedDoc.data() });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to update post." });
    }
});
// ✅ 댓글 목록
router.get("/posts/:segment/:postId/comments", requireAuth, async (req, res) => {
    const { segment, postId } = req.params;
    const collectionName = getCollectionName(segment, "comments");
    try {
        const commentsSnapshot = await getDb()
            .collection(collectionName)
            .where("postId", "==", postId)
            .orderBy("createdAt", "asc")
            .get();
        res.status(200).send(commentsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })));
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch comments." });
    }
});
// ✅ 댓글 작성
router.post("/posts/:segment/:postId/comments", requireAuth, async (req, res) => {
    const { segment, postId } = req.params;
    const { content } = req.body;
    const collectionName = getCollectionName(segment, "comments");
    try {
        const now = admin.firestore.Timestamp.now();
        const newComment = {
            postId,
            content,
            author: req.user?.displayName ?? "익명",
            authorId: req.user?.uid ?? "anonymous",
            avatar: "",
            createdAt: now,
        };
        const addedComment = await getDb().collection(collectionName).add(newComment);
        const postCollection = getCollectionName(segment, "posts");
        await getDb().collection(postCollection).doc(postId).update({
            commentsCount: admin.firestore.FieldValue.increment(1),
        });
        res.status(201).send({ id: addedComment.id, ...newComment });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to create comment." });
    }
});
// ✅ 좋아요
router.post("/posts/:segment/:postId/like", requireAuth, async (req, res) => {
    const { segment, postId } = req.params;
    const collectionName = getCollectionName(segment, "posts");
    try {
        const postRef = getDb().collection(collectionName).doc(postId);
        await postRef.update({
            likes: admin.firestore.FieldValue.increment(1),
        });
        const updated = await postRef.get();
        res.status(200).send(updated.data());
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to like post." });
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
        res.status(200).send(updated.data());
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to vote on post." });
    }
});
// ✅ 카테고리 목록
router.get("/categories/:segment", requireAuth, async (req, res) => {
    const { segment } = req.params;
    const collectionName = getCollectionName(segment, "categories");
    try {
        const categoriesSnapshot = await getDb().collection(collectionName).get();
        res.status(200).send(categoriesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })));
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ error: `Failed to fetch ${segment} categories.` });
    }
});
exports.communityRouter = router;
//# sourceMappingURL=community.js.map