import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import type { User } from "../types/user";

/** Firestore 'users' 수집 전체 조회 */
export const getUsers = async (): Promise<User[]> => {
  try {
    const usersCollection = collection(db, "users");
    const userSnapshot = await getDocs(usersCollection);
    const userList = userSnapshot.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        username: data.name ?? "N/A",
        email: data.email ?? "N/A",
        avatarUrl: data.avatar ?? "",
      } as User;
    });
    return userList;
  } catch (error) {
    console.error("Error fetching users from Firestore:", error);
    return [];
  }
};

/** 사용자 역할 업데이트 */
export const updateUserRole = async (
  userId: string,
  newRole: "admin" | "user"
): Promise<void> => {
  const userDoc = doc(db, "users", userId);
  await updateDoc(userDoc, { role: newRole });
};

/** 사용자 상태 업데이트 */
export const updateUserStatus = async (
  userId: string,
  newStatus: "active" | "banned"
): Promise<void> => {
  const userDoc = doc(db, "users", userId);
  await updateDoc(userDoc, { status: newStatus });
};

/** 사용자 삭제 */
export const deleteUser = async (userId: string): Promise<void> => {
  const userDoc = doc(db, "users", userId);
  await deleteDoc(userDoc);
};
