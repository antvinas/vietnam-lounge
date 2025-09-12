import * as express from 'express';
import * as admin from 'firebase-admin';
import {requireAuth} from '../middlewares/requireAuth';

const router = express.Router();
const db = admin.firestore();

// GET /users/me (Get current user's profile)
router.get('/me', requireAuth, async (req, res) => {
  const {uid} = req.user;
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      // This case might happen if the user record in Firestore wasn't created properly
      return res.status(404).send({error: 'User profile not found.'});
    }
    res.status(200).send({id: userDoc.id, ...userDoc.data()});
  } catch (error) {
    res.status(500).send({error: 'Failed to fetch user profile.'});
  }
});

// PUT /users/me (Update current user's profile)
router.put('/me', requireAuth, async (req, res) => {
  const {uid} = req.user;
  const {displayName, photoURL, bio} = req.body;

  // Basic validation
  if (!displayName) {
    return res.status(400).send({error: 'Display name cannot be empty.'});
  }

  try {
    const userRef = db.collection('users').doc(uid);
    const updateData = {
      displayName,
      photoURL: photoURL || null,
      bio: bio || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await userRef.update(updateData);
    res.status(200).send({message: 'Profile updated successfully', ...updateData});

  } catch (error) {
    res.status(500).send({error: 'Failed to update user profile.'});
  }
});

// GET /users/:id (Get a specific user's public profile)
router.get('/:id', async (req, res) => {
  const {id} = req.params;
  try {
    const userDoc = await db.collection('users').doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).send({error: 'User not found.'});
    }
    // Return only public-facing data
    const {displayName, photoURL, bio, createdAt} = userDoc.data()!;
    res.status(200).send({id: userDoc.id, displayName, photoURL, bio, createdAt});
  } catch (error) {
    res.status(500).send({error: 'Failed to fetch user profile.'});
  }
});

export const usersRouter = router;
