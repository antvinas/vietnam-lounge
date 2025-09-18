import { api } from '../lib/api';
import type { Spot, Review } from '@/types/spot';

export type { Spot, Review };

/**
 * Fetches all spots from the backend.
 */
export const fetchSpots = async (): Promise<Spot[]> => {
  const response = await api.get('/spots');
  return response.data;
};

/**
 * Fetches all adult spots from the backend.
 */
export const fetchAdultSpots = async (): Promise<Spot[]> => {
  const response = await api.get('/spots/adult');
  return response.data;
};

/**
 * Fetches a single spot by its ID.
 */
export const getSpotById = async (id: string): Promise<Spot | null> => {
  try {
    const response = await api.get(`/spots/${id}`);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { status?: number } };
    if (err.response && err.response.status === 404) {
      return null; // Handle not found gracefully
    }
    throw error;
  }
};

export const addSpot = async (spot: Omit<Spot, 'id'>): Promise<Spot> => {
  const response = await api.post('/spots', spot);
  return response.data;
};

/**
 * Fetches all reviews for a specific spot.
 */
export const fetchReviewsBySpotId = async (spotId: string): Promise<Review[]> => {
  const response = await api.get(`/spots/${spotId}/reviews`);
  return response.data;
};

/**
 * Adds a review to a specific spot.
 */
export const addReview = async (spotId: string, rating: number, comment: string, author: string): Promise<Review> => {
  const response = await api.post(`/spots/${spotId}/reviews`, { rating, comment, author });
  return response.data;
};

/**
 * Toggles the favorite status of a spot for the current user.
 */
export const toggleFavoriteStatus = async (spotId: string, isFavorited: boolean): Promise<Spot> => {
  const response = await api.post(`/spots/${spotId}/favorite`, { isFavorited });