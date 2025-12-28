import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// 🟢 [추가] 유저 생성 트리거
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  try {
    await db.collection('users').doc(user.uid).set({
      email: user.email,
      nickname: user.displayName || 'User',
      photoURL: user.photoURL || null,
      role: 'user', // 기본 권한
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`User created: ${user.uid}`);
  } catch (error) {
    console.error('Error creating user document:', error);
  }
});

// 🟢 [추가] 유저 삭제 트리거
export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
  try {
    await db.collection('users').doc(user.uid).delete();
    console.log(`User deleted: ${user.uid}`);
  } catch (error) {
    console.error('Error deleting user document:', error);
  }
});