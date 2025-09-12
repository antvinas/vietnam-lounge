import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { User } from "../types/user";

/**
 * Fetches all users from the Firestore 'users' collection.
 */
export const getUsers = async (): Promise<User[]> => {
  
  try {
    const usersCollection = collection(db, "users");
    const userSnapshot = await getDocs(usersCollection);
    const userList = userSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name || 'N/A',
            email: data.email || 'N/A',
            role: data.role || 'user',
            status: data.status || 'active',
            avatar: data.avatar || ''
        } as User;
    });
    return userList;
  } catch (error) {
    console.error("Error fetching users from Firestore:", error);
    return [];
  }
};

/**
 * Updates a user's role in Firestore.
 */
export const updateUserRole = async (userId: string, newRole: 'admin' | 'user'): Promise<void> => {
  
  const userDoc = doc(db, "users", userId);
  await updateDoc(userDoc, { role: newRole });
};

/**
 * Updates a user's status in Firestore.
 */
export const updateUserStatus = async (userId: string, newStatus: 'active' | 'banned'): Promise<void> => {
  
  const userDoc = doc(db, "users", userId);
  await updateDoc(userDoc, { status: newStatus });
};

/**
 * Deletes a user from Firestore.
 */
export const deleteUser = async (userId: string): Promise<void> => {
  
  const userDoc = doc(db, "users", userId);
  await deleteDoc(userDoc);
};
