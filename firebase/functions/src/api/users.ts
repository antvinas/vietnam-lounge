import * as express from 'express';
import * as admin from 'firebase-admin';
import { requireAuth } from '../middlewares/requireAuth';

const router = express.Router();
const db = admin.firestore();

// GET /users/me (Get current user's profile)
router.get('/me', requireAuth, async (req, res) => {
  const { uid } = req.user!;
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).send({ error: 'User profile not found.' });
    }
    res.status(200).send({ id: userDoc.id, ...userDoc.data() });
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch user profile.' });
  }
});

// PUT /users/me (Update current user's profile)
router.put('/me', requireAuth, async (req, res) => {
  const { uid } = req.user!;
  const { displayName, photoURL, bio } = req.body;

  // Create an object with only the fields that are provided
  const userProfile: { [key: string]: any } = {};
  if (displayName) userProfile.displayName = displayName;
  if (photoURL) userProfile.photoURL = photoURL;
  if (bio) userProfile.bio = bio;
  userProfile.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  if (Object.keys(userProfile).length === 1) { // Only updatedAt is present
    return res.status(400).send({ error: 'No update data provided.' });
  }

  try {
    await db.collection('users').doc(uid).update(userProfile);
    res.status(200).send({ message: "Profile updated successfully.", ...userProfile });
  } catch (error) {
    res.status(500).send({ error: 'Failed to update profile.' });
  }
});

// GET /users/:id (Get a specific user's public profile)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const userDoc = await db.collection('users').doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).send({ error: 'User not found.' });
    }

    // Return only public-facing data
    const a = userDoc.data();
    const publicProfile = {
      displayName: a?.displayName,
      photoURL: a?.photoURL,
      createdAt: a?.createdAt,
      reputation: a?.reputation,
      bio: a?.bio,
    };

    res.status(200).send(publicProfile);
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch user profile.' });
  }
});


export const usersRouter = router;
