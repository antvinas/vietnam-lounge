import { api } from '../lib/api';

// Data Types
export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  avatar: string; 
  category: string;
  timestamp: string;
  likes: number;
  commentsCount: number;
  viewCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: string;
  authorId: string;
  avatar: string; 
  content: string;
  timestamp: string;
}

export interface Category {
    id: string;
    name: string;
}

export interface PostFormData {
    title: string;
    content: string;
    category: string;
    segment: 'general' | 'adult';
}

// API Functions

/**
 * Fetches all posts, optionally filtering by category.
 */
export const getPosts = async (segment: string): Promise<Post[]> => {
    const response = await api.get(`/community/posts/${segment}`);
    return response.data;
};

/**
 * Fetches a single post by its ID.
 */
export const getPostById = async (id: string): Promise<Post | null> => {
    try {
        const response = await api.get(`/community/post/${id}`);
        return response.data;
    } catch (error: unknown) {
        const err = error as { response?: { status?: number } };
        if (err.response && err.response.status === 404) {
            return null;
        }
        throw error;
    }
};

/**
 * Fetches all comments for a given post.
 */
export const getCommentsByPostId = async (postId: string): Promise<Comment[]> => {
    const response = await api.get(`/community/posts/${postId}/comments`);
    return response.data;
};

/**
 * Creates a new post.
 */
export const createPost = async (postData: PostFormData): Promise<Post> => {
    const response = await api.post('/community/posts', postData);
    return response.data;
};

/**
 * Updates an existing post.
 */
export const updatePost = async (postId: string, postData: Partial<PostFormData>): Promise<Post> => {
    const response = await api.put(`/community/posts/${postId}`, postData);
    return response.data;
};

/**
 * Adds a new comment to a post.
 */
export const createComment = async (postId: string, content: string): Promise<Comment> => {
    const response = await api.post(`/community/posts/${postId}/comments`, { content });
    return response.data;
};

/**
 * Fetches all available post categories.
 */
export const getCategories = async (segment: string): Promise<Category[]> => {
    const response = await api.get(`/community/categories/${segment}`);
    return response.data;
};

/**
 * Toggles the like status for a post.
 */
export const updatePostLike = async (postId: string): Promise<{ likes: number }> => {
    const response = await api.post(`/community/posts/${postId}/like`);
    return response.data;
};
