import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Post } from "@/types/post";

const postsCollection = collection(db, "posts");

export const getPosts = async (): Promise<Post[]> => {
  try {
    const snapshot = await getDocs(postsCollection);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Post, "id">) }));
  } catch (e) {
    console.error("Error fetching posts:", e);
    return [];
  }
};

export const getPostById = async (id: string): Promise<Post | null> => {
  try {
    const ref = doc(db, "posts", id);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Post) : null;
  } catch (e) {
    console.error("Error fetching post:", e);
    return null;
  }
};
