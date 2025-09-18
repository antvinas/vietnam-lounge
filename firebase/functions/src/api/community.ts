import * as express from 'express';
import * as admin from 'firebase-admin';

const router = express.Router();

// ❌ const db = admin.firestore();  ← 제거

// ✅ 지연 초기화
const getDb = () => admin.firestore();

// Middleware for authentication
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  next();
};

// GET /community/posts/:segment/:id
router.get('/posts/:segment/:id', requireAuth, async (req, res) => {
  const { segment, id } = req.params;
  const collectionName = segment === 'adult' ? 'adult_posts' : 'posts';

  try {
    const postDoc = await getDb().collection(collectionName).doc(id).get();
    if (!postDoc.exists) return res.status(404).send({ error: 'Post not found.' });
    res.status(200).send({ id: postDoc.id, ...postDoc.data() });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to fetch post.' });
  }
});

// GET /community/posts/:segment
router.get('/posts/:segment', requireAuth, async (req, res) => {
  const { segment } = req.params;
  const collectionName = segment === 'adult' ? 'adult_posts' : 'posts';

  try {
    const postsSnapshot = await getDb().collection(collectionName).orderBy('timestamp', 'desc').get();
    res.status(200).send(postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error(error);
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
    };
    const addedPost = await getDb().collection(collectionName).add(newPost);
    res.status(201).send({ id: addedPost.id, ...newPost });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to create post.' });
  }
});

// GET /community/posts/:segment/:postId/comments
router.get('/posts/:segment/:postId/comments', requireAuth, async (req, res) => {
  const { segment, postId } = req.params;
  const collectionName = segment === 'adult' ? 'adult_comments' : 'comments';

  try {
    const commentsSnapshot = await getDb().collection(collectionName).where('postId', '==', postId).orderBy('timestamp', 'asc').get();
    res.status(200).send(commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error(error);
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
    };
    const addedComment = await getDb().collection(collectionName).add(newComment);
    res.status(201).send({ id: addedComment.id, ...newComment });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to create comment.' });
  }
});

// GET /community/categories/:segment
router.get('/categories/:segment', requireAuth, async (req, res) => {
  const { segment } = req.params;
  const collectionName = segment === 'adult' ? 'adult_categories' : 'categories';

  try {
    const categoriesSnapshot = await getDb().collection(collectionName).get();
    res.status(200).send(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: `Failed to fetch ${segment} categories.` });
  }
});

export const communityRouter = router;
