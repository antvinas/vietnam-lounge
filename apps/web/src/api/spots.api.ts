
import { api } from '../lib/api';

// Data Types
export interface Spot {
  id: string;
  name: string;
  description: string;
  category: string;
  region: string;
  city: string;
  address: string;
  operatingHours: string;
  imageUrl: string; // This was the original single image
  imageUrls: string[]; // Expanded to a gallery
  rating: number;
  latitude: number;
  longitude: number;
  isFavorited?: boolean; // Optional, as it depends on the user
}

export interface Review {
  id: string;
  spotId: string;
  author: string;
  avatar: string;
  rating: number;
  comment: string;
  timestamp: string; 
}

/**
 * Fetches all spots from the backend.
 */
export const fetchSpots = async (): Promise<Spot[]> => {
  const response = await api.get('/spots');
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
    return response.data;
};

/**
 * Fetches featured spots.
 */
export const fetchFeaturedSpots = async (): Promise<Spot[]> => {
  const response = await api.get('/spots/featured');
  return response.data;
};

/**
 * Fetches recommendations for a given spot.
 */
export const getRecommendations = async (spotId: string): Promise<Spot[]> => {
  const response = await api.get(`/spots/${spotId}/recommendations`);
  return response.data;
};
