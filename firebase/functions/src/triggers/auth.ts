import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {logger} from '../utils/logger';

const db = admin.firestore();

/**
 * Triggered when a new user is created in Firebase Authentication.
 * Creates a corresponding user profile document in Firestore.
 */
export const handleCreateUser = async (user: admin.auth.UserRecord) => {
  const {uid, email, displayName, photoURL} = user;

  logger.info(`New user creating profile: ${uid}`);

  const userRef = db.collection('users').doc(uid);

  const newUserProfile = {
    email: email || '',
    displayName: displayName || 'Unnamed User',
    photoURL: photoURL || null,
    bio: '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    level: 1,
    xp: 0,
    // Add any other initial fields for a new user
  };

  try {
    await userRef.set(newUserProfile);
    logger.info(`Successfully created profile for user: ${uid}`);
  } catch (error) {
    logger.error(`Error creating profile for user ${uid}:`, error);
  }
};
