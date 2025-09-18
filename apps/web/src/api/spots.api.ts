import { api } from '@/lib/api';
import type { Spot, Review } from '@/types/spot';

// Fetch all spots (for day mode)
export const fetchSpots = async (): Promise<Spot[]> => {
  const response = await api.get('/spots');
  return response.data;
};

// Fetch all adult spots (for night mode)
export const fetchAdultSpots = async (): Promise<Spot[]> => {
  const response = await api.get('/spots/adult');
  return response.data;
};

// Fetch featured spots
export const fetchFeaturedSpots = async (): Promise<Spot[]> => {
  const response = await api.get('/spots/featured');
  return response.data;
};

// Spot details
export const getSpotById = async (id: string): Promise<Spot> => {
  const response = await api.get(`/spots/detail`, { params: { id } });
  return response.data;
};

// Recommendations
export const getRecommendations = async (spotId: string): Promise<Spot[]> => {
  const response = await api.get(`/spots/recommendations`, { params: { spotId } });
  return response.data;
};

// Add review
export const addReview = async (spotId: string, review: Partial<Review>): Promise<Review> => {
  const response = await api.post(`/spots/review`, { spotId, review });
  return response.data;
};

// Fetch reviews
export const fetchReviewsBySpotId = async (spotId: string): Promise<Review[]> => {
  const response = await api.get(`/spots/reviews`, { params: { spotId } });
  return response.data;
};

// Toggle favorite
export const toggleFavoriteStatus = async ({ spotId }: { spotId: string }): Promise<{ isFavorite: boolean }> => {
  const response = await api.post('/spots/favorite', { spotId });
  return response.data;
};

// Add new spot
export const addSpot = async (spot: Omit<Spot, 'id'>): Promise<Spot> => {
  const response = await api.post('/spots', spot);
  return response.data;
};
