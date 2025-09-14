
import * as express from 'express';
import * as admin from 'firebase-admin';
import NodeCache from 'node-cache';

const router = express.Router();
const db = admin.firestore();
const recommendationCache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

// Middleware to check if the user is authenticated and has age verification for adult content
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!(req as any).user) {
        return res.status(401).send('Unauthorized');
    }
    next();
};

const requireAgeVerification = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!(req as any).user || !(req as any).user.ageVerified) {
        return res.status(403).send('Forbidden: Age verification required');
    }
    next();
};

// GET /spots - Fetches all spots (Day mode)
router.get('/', requireAuth, async (req: express.Request, res: express.Response) => {
    try {
        const spotsSnapshot = await db.collection('spots').get();
        const spots = spotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(spots);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch spots.' });
    }
});

// GET /spots/adult - Fetches all adult spots (Night mode)
router.get('/adult', requireAuth, requireAgeVerification, async (req: express.Request, res: express.Response) => {
    try {
        const adultSpotsSnapshot = await db.collection('adult_spots').get();
        const adultSpots = adultSpotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(adultSpots);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch adult spots.' });
    }
});

// GET /spots/featured - Fetches featured spots
router.get('/featured', async (req: express.Request, res: express.Response) => {
    try {
        const spotsSnapshot = await db.collection('spots').where('featured', '==', true).limit(5).get();
        const featuredSpots = spotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(featuredSpots);
    } catch (error) {
        res.status(500).send({ error: 'Failed to fetch featured spots.' });
    }
});


// GET /spots/detail?id=...
router.get('/detail', async (req: express.Request, res: express.Response) => {
  const { id } = req.query;
  if (!id) {
    return res.status(400).send({ error: 'Spot ID is required.' });
  }

  try {
    const spotDoc = await db.collection('spots').doc(id as string).get();
    if (!spotDoc.exists) {
      return res.status(404).send({ error: 'Spot not found.' });
    }

    // Atomically increment the view count
    await spotDoc.ref.update({ views: admin.firestore.FieldValue.increment(1) });

    res.status(200).send({ id: spotDoc.id, ...spotDoc.data() });
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch spot detail.' });
  }
});


// GET /spots/recommendations?spotId=...
router.get('/recommendations', async (req: express.Request, res: express.Response) => {
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
    const spotDoc = await db.collection('spots').doc(spotId as string).get();
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
      .filter((spot: any) => spot.id !== spotId) // Exclude the original spot
      .slice(0, 5); // Ensure we only have 5 recommendations

    recommendationCache.set(cacheKey, recommendations);

    res.status(200).send(recommendations);

  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch recommendations.' });
  }
});

// --- Add other spot-related endpoints here ---
// e.g., POST /spots/like
// e.g., GET /spots/admin/list

export const spotsRouter = router;
