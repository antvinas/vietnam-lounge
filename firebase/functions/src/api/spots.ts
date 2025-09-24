import * as express from 'express';
import * as admin from 'firebase-admin';
import NodeCache from 'node-cache';

const router = express.Router();
const recommendationCache = new NodeCache({ stdTTL: 3600 });

// 지연 초기화 Firestore 인스턴스
const getDb = () => admin.firestore();

// Middleware: 로그인 필요
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(req as any).user) {
    return res.status(401).send('Unauthorized');
  }
  next();
};

// Middleware: 성인 인증 필요
const requireAgeVerification = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!(req as any).user || !(req as any).user.ageVerified) {
    return res.status(403).send('Forbidden: Age verification required');
  }
  next();
};

// --- Routes ---

// 성인 스팟
router.get('/adult', requireAuth, requireAgeVerification, async (_req, res) => {
  try {
    const snapshot = await getDb().collection('adult_spots').get();
    res.status(200).send(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to fetch adult spots.' });
  }
});

// 추천 스팟
router.get('/featured', async (_req, res) => {
  try {
    const snapshot = await getDb().collection('spots').where('featured', '==', true).limit(5).get();
    res.status(200).send(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to fetch featured spots.' });
  }
});

// 상세조회
router.get('/detail', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).send({ error: 'Spot ID is required.' });

  try {
    const doc = await getDb().collection('spots').doc(id as string).get();
    if (!doc.exists) return res.status(404).send({ error: 'Spot not found.' });

    await doc.ref.update({ views: admin.firestore.FieldValue.increment(1) });
    res.status(200).send({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to fetch spot detail.' });
  }
});

// 추천 목록
router.get('/recommendations', async (req, res) => {
  const { spotId } = req.query;
  if (!spotId) return res.status(400).send({ error: 'Spot ID is required.' });

  const cacheKey = `recommendations_${spotId}`;
  const cached = recommendationCache.get(cacheKey);
  if (cached) return res.status(200).send(cached);

  try {
    const spotDoc = await getDb().collection('spots').doc(spotId as string).get();
    if (!spotDoc.exists || !spotDoc.data()) return res.status(404).send({ error: 'Original spot not found.' });

    const { citySlug, category } = spotDoc.data()!;
    const snapshot = await getDb().collection('spots')
      .where('citySlug', '==', citySlug)
      .where('category', '==', category)
      .orderBy('views', 'desc')
      .limit(6)
      .get();

    const recommendations = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((s: any) => s.id !== spotId)
      .slice(0, 5);

    recommendationCache.set(cacheKey, recommendations);
    res.status(200).send(recommendations);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to fetch recommendations.' });
  }
});

// 리뷰 추가
router.post('/review', requireAuth, async (req, res) => {
  const { spotId, review } = req.body;
  const userId = (req as any).user.uid;
  if (!spotId || !review?.rating || !review?.text) {
    return res.status(400).send({ error: 'Missing spotId or review data.' });
  }
  try {
    const spotRef = getDb().collection('spots').doc(spotId);
    const newReview = { ...review, userId, createdAt: admin.firestore.FieldValue.serverTimestamp() };
    const docRef = await spotRef.collection('reviews').add(newReview);
    res.status(201).send({ id: docRef.id, ...newReview });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to add review.' });
  }
});

// 리뷰 목록
router.get('/reviews', async (req, res) => {
  const { spotId } = req.query;
  if (!spotId) return res.status(400).send({ error: 'Spot ID is required.' });

  try {
    const snapshot = await getDb().collection('spots').doc(spotId as string).collection('reviews').orderBy('createdAt', 'desc').get();
    res.status(200).send(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to fetch reviews.' });
  }
});

// 즐겨찾기 토글
router.post('/favorite', requireAuth, async (req, res) => {
  const { spotId } = req.body;
  const userId = (req as any).user.uid;
  if (!spotId) return res.status(400).send({ error: 'Spot ID is required.' });

  try {
    const userRef = getDb().collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).send({ error: 'User not found.' });

    const favorites = userDoc.data()?.favorites || [];
    let isFavorite: boolean;
    if (favorites.includes(spotId)) {
      await userRef.update({ favorites: admin.firestore.FieldValue.arrayRemove(spotId) });
      isFavorite = false;
    } else {
      await userRef.update({ favorites: admin.firestore.FieldValue.arrayUnion(spotId) });
      isFavorite = true;
    }
    res.status(200).send({ isFavorite });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to update favorite status.' });
  }
});

// 새 스팟 추가
router.post('/', requireAuth, async (req, res) => {
  const data = req.body;
  const userId = (req as any).user.uid;
  if (!data.name || !data.category || !data.citySlug) {
    return res.status(400).send({ error: 'Missing required spot data.' });
  }
  try {
    const newSpot = { ...data, createdBy: userId, createdAt: admin.firestore.FieldValue.serverTimestamp(), views: 0 };
    const docRef = await getDb().collection('spots').add(newSpot);
    res.status(201).send({ id: docRef.id, ...newSpot });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Failed to create spot.' });
  }
});

// 모든 스팟
router.get('/', async (_req, res) => {
  try {
    const snapshot = await getDb().collection('spots').get();
    res.status(200).send(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  } catch (error) {
    console.error('Error fetching spots:', error);
    res.status(500).send({ error: 'Failed to fetch spots.' });
  }
});

export const spotsRouter = router;
