
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';

/**
 * Triggered on new user creation.
 * Creates a corresponding user profile document in Firestore.
 * @param {functions.auth.UserRecord} user The user record.
 * @returns {Promise<void>}
 */
export const handleCreateUser = async (user: functions.auth.UserRecord): Promise<void> => {
  const { uid, email, displayName, photoURL } = user;

  // Basic user profile data
  const userProfile = {
    email: email || '',
    displayName: displayName || 'Unnamed User',
    photoURL: photoURL || '',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    roles: ['user'], // Default role
    reputation: 0, // Starting reputation
    lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    // Add any other initial fields you need
  };

  try {
    await admin.firestore().collection('users').doc(uid).set(userProfile);
    console.log(`Successfully created profile for user: ${uid}`);
  } catch (error) {
    console.error(`Failed to create profile for user: ${uid}`, error);
  }
};
