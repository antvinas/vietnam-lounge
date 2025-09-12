import { api } from '../lib/api';
import { Post } from './community.api'; // Assuming Post type is defined here

export interface UserProfile {
    userId: string;
    nickname: string;
    email: string;
    bio: string;
    avatarUrl: string;
}

export interface ProfileUpdateData {
    nickname?: string;
    bio?: string;
    avatarUrl?: string;
}

export interface Coupon {
    id: string;
    name: string;
    description: string;
    discount: string;
    expiryDate: string;
}

/**
 * Fetches the current user's profile.
 */
export const getUserProfile = async (): Promise<UserProfile> => {
    const response = await api.get('/user/profile');
    return response.data;
};

/**
 * Updates the current user's profile.
 */
export const updateUserProfile = async (data: ProfileUpdateData): Promise<UserProfile> => {
    const response = await api.put('/user/profile', data);
    return response.data;
};

/**
 * Fetches the posts created by the current user.
 */
export const getMyPosts = async (): Promise<Post[]> => {
    const response = await api.get('/user/my-posts');
    return response.data;
};

/**
 * Fetches the posts bookmarked by the current user.
 */
export const getBookmarkedPosts = async (): Promise<Post[]> => {
    const response = await api.get('/user/bookmarks');
    return response.data;
};

/**
 * Fetches the coupons owned by the current user.
 */
export const getMyCoupons = async (): Promise<Coupon[]> => {
    const response = await api.get('/user/coupons');
    return response.data;
};
