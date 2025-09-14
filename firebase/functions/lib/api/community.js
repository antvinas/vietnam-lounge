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
exports.communityRouter = void 0;
const express = __importStar(require("express"));
const admin = __importStar(require("firebase-admin"));
const router = express.Router();
const db = admin.firestore();
// Middleware for authentication
const requireAuth = (req, res, next) => {
    // Implement your authentication logic here
    // For example, checking a Firebase token
    next();
};
// GET /community/posts/:segment/:id
router.get('/posts/:segment/:id', requireAuth, async (req, res) => {
    const { segment, id } = req.params;
    const collectionName = segment === 'adult' ? 'adult_posts' : 'posts';
    try {
        const postDoc = await db.collection(collectionName).doc(id).get();
        if (!postDoc.exists) {
            return res.status(404).send({ error: 'Post not found.' });
        }
        res.status(200).send({ id: postDoc.id, ...postDoc.data() });
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to fetch post.' });
    }
});
// GET /community/posts/:segment (general or adult)
router.get('/posts/:segment', requireAuth, async (req, res) => {
    const { segment } = req.params;
    const collectionName = segment === 'adult' ? 'adult_posts' : 'posts';
    try {
        const postsSnapshot = await db.collection(collectionName).orderBy('timestamp', 'desc').get();
        const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(posts);
    }
    catch (error) {
        res.status(500).send({ error: `Failed to fetch ${segment} posts.` });
    }
});
// POST /community/posts
router.post('/posts', requireAuth, async (req, res) => {
    const { title, content, category, segment } = req.body;
    const collectionName = segment === 'adult' ? 'adult_posts' : 'posts';
    try {
        const newPost = {
            title,
            content,
            category,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            // ... other post fields
        };
        const addedPost = await db.collection(collectionName).add(newPost);
        res.status(201).send({ id: addedPost.id, ...newPost });
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to create post.' });
    }
});
// GET /community/posts/:segment/:postId/comments
router.get('/posts/:segment/:postId/comments', requireAuth, async (req, res) => {
    const { segment, postId } = req.params;
    const collectionName = segment === 'adult' ? 'adult_comments' : 'comments';
    try {
        const commentsSnapshot = await db.collection(collectionName).where('postId', '==', postId).orderBy('timestamp', 'asc').get();
        const comments = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(comments);
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to fetch comments.' });
    }
});
// POST /community/posts/:segment/:postId/comments
router.post('/posts/:segment/:postId/comments', requireAuth, async (req, res) => {
    const { segment, postId } = req.params;
    const { content } = req.body;
    const collectionName = segment === 'adult' ? 'adult_comments' : 'comments';
    try {
        const newComment = {
            postId,
            content,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            // ... other comment fields
        };
        const addedComment = await db.collection(collectionName).add(newComment);
        res.status(201).send({ id: addedComment.id, ...newComment });
    }
    catch (error) {
        res.status(500).send({ error: 'Failed to create comment.' });
    }
});
// GET /community/categories/:segment
router.get('/categories/:segment', requireAuth, async (req, res) => {
    const { segment } = req.params;
    const collectionName = segment === 'adult' ? 'adult_categories' : 'categories';
    try {
        const categoriesSnapshot = await db.collection(collectionName).get();
        const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(categories);
    }
    catch (error) {
        res.status(500).send({ error: `Failed to fetch ${segment} categories.` });
    }
});
exports.communityRouter = router;
//# sourceMappingURL=community.js.map