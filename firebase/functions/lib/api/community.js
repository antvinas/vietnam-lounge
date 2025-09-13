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
const requireAuth_1 = require("../middlewares/requireAuth");
const BadWords_service_1 = require("../services/bad-words/BadWords.service");
const router = express.Router();
const db = admin.firestore();
const badWordsService = BadWords_service_1.BadWordsService.getInstance();
// --- Posts Endpoints ---
// GET /community/list (List all posts)
router.get('/list', async (req, res) => {
    const { segment, tag, authorId } = req.query;
    try {
        let query = db.collection('posts');
        if (segment) {
            query = query.where('segment', '==', segment);
        }
        if (tag) {
            query = query.where('tags', 'array-contains', tag);
        }
        if (authorId) {
            query = query.where('authorId', '==', authorId);
        }
        const postsSnapshot = await query.orderBy('createdAt', 'desc').get();
        const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(posts);
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to fetch posts.' });
    }
});
// GET /community/post/:id (Get a single post)
router.get('/post/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const postDoc = await db.collection('posts').doc(id).get();
        if (!postDoc.exists) {
            return res.status(404).send({ error: 'Post not found.' });
        }
        // Increment view count
        await db.collection('posts').doc(id).update({ views: admin.firestore.FieldValue.increment(1) });
        res.status(200).send({ id: postDoc.id, ...postDoc.data() });
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to fetch post.' });
    }
});
// POST /community/create (Create a new post)
router.post('/create', requireAuth_1.requireAuth, async (req, res) => {
    const { title, content, segment, tags } = req.body;
    const { uid: authorId } = req.user;
    if (!title || !content) {
        return res.status(400).send({ error: 'Title and content are required.' });
    }
    // Bad words filter
    if (badWordsService.containsBlockedWords(title) || badWordsService.containsBlockedWords(content)) {
        return res.status(400).send({ error: 'Post contains blocked words.' });
    }
    try {
        const newPost = {
            title,
            content,
            segment: segment || 'general',
            tags: tags || [],
            authorId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            likeCount: 0,
            commentCount: 0,
            views: 0,
        };
        const postRef = await db.collection('posts').add(newPost);
        res.status(201).send({ id: postRef.id, ...newPost });
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to create post.' });
    }
});
// PUT /community/post/:id (Update a post)
router.put('/post/:id', requireAuth_1.requireAuth, async (req, res) => {
    const { id } = req.params;
    const { uid } = req.user;
    const { title, content, segment, tags } = req.body;
    if (badWordsService.containsBlockedWords(title) || badWordsService.containsBlockedWords(content)) {
        return res.status(400).send({ error: 'Update contains blocked words.' });
    }
    try {
        const postRef = db.collection('posts').doc(id);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(404).send({ error: 'Post not found.' });
        }
        if (postDoc.data()?.authorId !== uid) {
            return res.status(403).send({ error: 'User not authorized to update this post.' });
        }
        await postRef.update({
            title,
            content,
            segment,
            tags,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(200).send({ message: 'Post updated successfully' });
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to update post.' });
    }
});
// DELETE /community/post/:id (Delete a post)
router.delete('/post/:id', requireAuth_1.requireAuth, async (req, res) => {
    const { id } = req.params;
    const { uid } = req.user;
    try {
        const postRef = db.collection('posts').doc(id);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            return res.status(404).send({ error: 'Post not found.' });
        }
        if (postDoc.data()?.authorId !== uid) {
            return res.status(403).send({ error: 'User not authorized to delete this post.' });
        }
        // Note: In a real app, you might want to delete comments and likes as well (or handle them differently)
        await postRef.delete();
        res.status(200).send({ message: 'Post deleted successfully.' });
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to delete post.' });
    }
});
// --- Comments Endpoints ---
// POST /community/comment (Add a comment to a post)
router.post('/comment', requireAuth_1.requireAuth, async (req, res) => {
    const { postId, content } = req.body;
    const { uid: authorId } = req.user;
    if (!postId || !content) {
        return res.status(400).send({ error: 'Post ID and content are required.' });
    }
    if (badWordsService.containsBlockedWords(content)) {
        return res.status(400).send({ error: 'Comment contains blocked words.' });
    }
    try {
        const postRef = db.collection('posts').doc(postId);
        const commentRef = postRef.collection('comments').doc();
        await db.runTransaction(async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists) {
                throw new Error("Post not found");
            }
            transaction.set(commentRef, {
                content,
                authorId,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                likeCount: 0,
            });
            transaction.update(postRef, { commentCount: admin.firestore.FieldValue.increment(1) });
        });
        res.status(201).send({ id: commentRef.id, message: 'Comment added successfully.' });
    }
    catch (error) {
        res.status(500).send({ error: error.message || 'Failed to add comment.' });
    }
});
// GET /community/comments (Get comments for a post)
router.get('/comments', async (req, res) => {
    const { postId } = req.query;
    if (!postId) {
        return res.status(400).send({ error: 'Post ID is required.' });
    }
    try {
        const commentsSnapshot = await db.collection('posts').doc(postId).collection('comments').orderBy('createdAt', 'desc').get();
        const comments = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(comments);
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to fetch comments.' });
    }
});
// --- Likes Endpoints ---
// POST /community/like (Like a post or comment)
router.post('/like', requireAuth_1.requireAuth, async (req, res) => {
    const { targetId, targetType } = req.body; // targetType can be 'post' or 'comment'
    const { uid } = req.user;
    if (!targetId || !targetType) {
        return res.status(400).send({ error: 'Target ID and type are required.' });
    }
    try {
        let targetRef;
        if (targetType === 'post') {
            targetRef = db.collection('posts').doc(targetId);
        }
        else if (targetType === 'comment') {
            // To like a comment, we need the postId as well.
            // The request should be structured like: { targetType: 'comment', postId: '...', targetId: '...'}
            const { postId } = req.body;
            if (!postId)
                return res.status(400).send({ error: 'Post ID is required for liking a comment.' });
            targetRef = db.collection('posts').doc(postId).collection('comments').doc(targetId);
        }
        else {
            return res.status(400).send({ error: 'Invalid target type.' });
        }
        const likeRef = targetRef.collection('likes').doc(uid);
        await db.runTransaction(async (transaction) => {
            const likeDoc = await transaction.get(likeRef);
            if (likeDoc.exists) {
                // User already liked it, so unlike
                transaction.delete(likeRef);
                transaction.update(targetRef, { likeCount: admin.firestore.FieldValue.increment(-1) });
            }
            else {
                // User has not liked it yet, so like
                transaction.set(likeRef, { createdAt: admin.firestore.FieldValue.serverTimestamp() });
                transaction.update(targetRef, { likeCount: admin.firestore.FieldValue.increment(1) });
            }
        });
        res.status(201).send({ message: 'Like status toggled successfully.' });
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to toggle like status.' });
    }
});
// POST /community/report (Report a post or comment)
router.post('/report', requireAuth_1.requireAuth, async (req, res) => {
    const { targetId, targetType, reason, postId } = req.body;
    const { uid: reporterId } = req.user;
    if (!targetId || !targetType) {
        return res.status(400).send({ error: 'Target ID and type are required.' });
    }
    if (targetType === 'comment' && !postId) {
        return res.status(400).send({ error: 'Post ID is required for reporting a comment.' });
    }
    try {
        const report = {
            targetId,
            targetType,
            postId: targetType === 'comment' ? postId : null,
            reporterId,
            reason: reason || 'No reason provided.',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending', // pending, reviewed, resolved
        };
        await db.collection('reports').add(report);
        res.status(201).send({ message: 'Report submitted successfully.' });
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to submit report.' });
    }
});
exports.communityRouter = router;
//# sourceMappingURL=community.js.map