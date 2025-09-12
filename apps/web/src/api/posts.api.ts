import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Post } from '../types/post';

const postsCollection = collection(db, 'posts');

export const getPosts = async (): Promise<Post[]> => {
  try {
    const snapshot = await getDocs(postsCollection);
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Post, 'id'>),
    }));
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
};

export const getPostById = async (id: string): Promise<Post | null> => {
  try {
    const docRef = doc(db, 'posts', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Post;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
};
