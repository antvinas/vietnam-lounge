import * as express from 'express';
import * as admin from 'firebase-admin';

const router = express.Router();
const db = admin.firestore();

// Middleware for authentication
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Implement your authentication logic here
    // For example, checking a Firebase token
    next();
};

// GET /community/posts/:segment/:id
router.get('/posts/:segment/:id', requireAuth, async (req: express.Request, res: express.Response) => {
    const { segment, id } = req.params;
    const collectionName = segment === 'adult' ? 'adult_posts' : 'posts';

    try {
        const postDoc = await db.collection(collectionName).doc(id).get();
        if (!postDoc.exists) {
            return res.status(404).send({ error: 'Post not found.' });
        }
        res.status(200).send({ id: postDoc.id, ...postDoc.data() });
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch post.' });
    }
});

// GET /community/posts/:segment (general or adult)
router.get('/posts/:segment', requireAuth, async (req: express.Request, res: express.Response) => {
    const { segment } = req.params;
    const collectionName = segment === 'adult' ? 'adult_posts' : 'posts';

    try {
        const postsSnapshot = await db.collection(collectionName).orderBy('timestamp', 'desc').get();
        const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(posts);
    } catch (error) {
        res.status(500).send({ error: `Failed to fetch ${segment} posts.` });
    }
});

// POST /community/posts
router.post('/posts', requireAuth, async (req: express.Request, res: express.Response) => {
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
    } catch (error) {
        res.status(500).send({ error: 'Failed to create post.' });
    }
});

// GET /community/posts/:segment/:postId/comments
router.get('/posts/:segment/:postId/comments', requireAuth, async (req: express.Request, res: express.Response) => {
    const { segment, postId } = req.params;
    const collectionName = segment === 'adult' ? 'adult_comments' : 'comments';

    try {
        const commentsSnapshot = await db.collection(collectionName).where('postId', '==', postId).orderBy('timestamp', 'asc').get();
        const comments = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(comments);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch comments.' });
    }
});

// POST /community/posts/:segment/:postId/comments
router.post('/posts/:segment/:postId/comments', requireAuth, async (req: express.Request, res: express.Response) => {
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
    } catch (error) {
        res.status(500).send({ error: 'Failed to create comment.' });
    }
});

// GET /community/categories/:segment
router.get('/categories/:segment', requireAuth, async (req: express.Request, res: express.Response) => {
    const { segment } = req.params;
    const collectionName = segment === 'adult' ? 'adult_categories' : 'categories';

    try {
        const categoriesSnapshot = await db.collection(collectionName).get();
        const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(categories);
    } catch (error) {
        res.status(500).send({ error: `Failed to fetch ${segment} categories.` });
    }
});


export const communityRouter = router;
