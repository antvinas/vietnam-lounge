// firebase/functions/src/api/users.ts
import * as express from 'express';
import * as admin from 'firebase-admin';
import { requireAuth } from '../middlewares/requireAuth';

const router = express.Router();
const db = admin.firestore();

// GET /users/me
router.get('/me', requireAuth, async (req, res) => {
  const { uid } = req.user!;
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).send({ error: 'User profile not found.' });
    }
    return res.status(200).send({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    return res.status(500).send({ error: 'Failed to fetch user profile.' });
  }
});

// PUT /users/me
router.put('/me', requireAuth, async (req, res) => {
  const { uid } = req.user!;
  const { nickname, displayName, avatar, photoURL, bio } = req.body;

  const userProfile: { [key: string]: any } = {};
  
  if (nickname) userProfile.nickname = nickname;
  else if (displayName) userProfile.nickname = displayName;

  if (avatar) userProfile.avatar = avatar;
  else if (photoURL) userProfile.avatar = photoURL;

  if (bio !== undefined) userProfile.bio = bio;
  
  userProfile.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  if (Object.keys(userProfile).length <= 1) {
    return res.status(400).send({ error: 'No update data provided.' });
  }

  try {
    await db.collection('users').doc(uid).update(userProfile);
    const updated = await db.collection('users').doc(uid).get();
    return res.status(200).send({ message: "Profile updated successfully.", ...updated.data() });
  } catch (error) {
    return res.status(500).send({ error: 'Failed to update profile.' });
  }
});

// DELETE /users/me
router.delete('/me', requireAuth, async (req, res) => {
  const { uid } = req.user!;
  try {
    await db.collection('users').doc(uid).delete();
    await admin.auth().deleteUser(uid);
    return res.status(200).send({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).send({ error: 'Failed to delete user.' });
  }
});

// GET /users/:id
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
    return res.status(200).send(publicProfile);
  } catch (error) {
    return res.status(500).send({ error: 'Failed to fetch public profile.' });
  }
});

// GET /users/me/favorites
router.get('/me/favorites', requireAuth, async (req, res) => {
  const { uid } = req.user!;
  try {
    const snapshot = await db.collection('users').doc(uid).collection('favorites')
      .orderBy('savedAt', 'desc')
      .get();

    const favorites = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.status(200).send(favorites);
  } catch (error) {
    console.error("Get favorites error:", error);
    return res.status(500).send({ error: 'Failed to fetch favorites.' });
  }
});

// POST /users/me/favorites
router.post('/me/favorites', requireAuth, async (req, res) => {
  const { uid } = req.user!;
  const { spotId } = req.body;

  if (!spotId) return res.status(400).send({ error: 'spotId is required' });

  try {
    const favRef = db.collection('users').doc(uid).collection('favorites').doc(spotId);
    
    const existing = await favRef.get();
    if (existing.exists) {
      return res.status(200).send({ message: "Already favorited." });
    }

    let spotDoc = await db.collection('spots').doc(spotId).get();
    let mode = 'explorer';

    if (!spotDoc.exists) {
      spotDoc = await db.collection('adult_spots').doc(spotId).get();
      mode = 'nightlife';
    }

    if (!spotDoc.exists) {
      return res.status(404).send({ error: 'Spot not found.' });
    }

    const spotData = spotDoc.data() || {};

    const favoriteData = {
      name: spotData.name || 'Unknown',
      category: spotData.category || '기타',
      address: spotData.address || spotData.location?.address || '',
      thumbnail: Array.isArray(spotData.images) && spotData.images.length > 0 ? spotData.images[0] : null,
      rating: spotData.rating || 0,
      mode: mode,
      region: spotData.region || '',
      latitude: spotData.latitude || spotData.location?.lat || null,
      longitude: spotData.longitude || spotData.location?.lng || null,
      savedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await favRef.set(favoriteData);

    return res.status(201).send({ message: "Added to favorites.", data: favoriteData });
  } catch (error) {
    console.error("Add favorite error:", error);
    return res.status(500).send({ error: 'Failed to add favorite.' });
  }
});

// DELETE /users/me/favorites/:spotId
router.delete('/me/favorites/:spotId', requireAuth, async (req, res) => {
  const { uid } = req.user!;
  const { spotId } = req.params;

  try {
    await db.collection('users').doc(uid).collection('favorites').doc(spotId).delete();
    return res.status(200).send({ message: "Removed from favorites." });
  } catch (error) {
    console.error("Remove favorite error:", error);
    return res.status(500).send({ error: 'Failed to remove favorite.' });
  }
});

export const usersRouter = router;