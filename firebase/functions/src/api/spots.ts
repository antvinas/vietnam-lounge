
import * as express from 'express';
import * as admin from 'firebase-admin';
import NodeCache from 'node-cache';

const router = express.Router();
const db = admin.firestore();
const recommendationCache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

// GET /spots/detail?id=...
router.get('/detail', async (req, res) => {
  const {id} = req.query;
  if (!id) {
    return res.status(400).send({error: 'Spot ID is required.'});
  }

  try {
    const spotDoc = await db.collection('spots').doc(id as string).get();
    if (!spotDoc.exists) {
      return res.status(404).send({error: 'Spot not found.'});
    }
    
    // Atomically increment the view count
    await spotDoc.ref.update({ views: admin.firestore.FieldValue.increment(1) });
    
    res.status(200).send({id: spotDoc.id, ...spotDoc.data()});
  } catch (error) {
    res.status(500).send({error: 'Failed to fetch spot detail.'});
  }
});


// GET /spots/recommendations?spotId=...
router.get('/recommendations', async (req, res) => {
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
            .filter(spot => spot.id !== spotId) // Exclude the original spot
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
