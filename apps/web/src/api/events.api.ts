import { api } from '../lib/api';
import { Event } from "../types/event";

/**
 * Fetches all events, for Day or Night mode.
 */
export const getEvents = async (isNight: boolean): Promise<Event[]> => {
  const segment = isNight ? 'adult' : 'general';
  try {
    const response = await api.get(`/events/${segment}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${segment} events:`, error);
    return [];
  }
};

/**
 * Fetches a single event by its ID, for Day or Night mode.
 */
export const getEventById = async (id: string, isNight: boolean): Promise<Event | null> => {
  const segment = isNight ? 'adult' : 'general';
  try {
    const response = await api.get(`/events/${segment}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching event ${id}:`, error);
    return null;
  }
};

/**
 * Adds a new event.
 */
export const addEvent = async (event: Omit<Event, 'id'>, isNight: boolean): Promise<string> => {
  const segment = isNight ? 'adult' : 'general';
  try {
    const response = await api.post(`/events/${segment}`, event);
    return response.data.id;
  } catch (error) {
    console.error("Error adding event:", error);
    throw new Error('Failed to add event');
  }
};

/**
 * Deletes an event by its ID.
 */
export const deleteEvent = async (id: string, isNight: boolean): Promise<void> => {
  const segment = isNight ? 'adult' : 'general';
  try {
    await api.delete(`/events/${segment}/${id}`);
  } catch (error) {
    console.error(`Error deleting event ${id}:`, error);
    throw new Error('Failed to delete event');
  }
};

/**
 * Fetches upcoming events.
 */
export const fetchUpcomingEvents = async (isNight: boolean): Promise<Event[]> => {
    const segment = isNight ? 'adult' : 'general';
    const response = await api.get(`/events/${segment}/upcoming`);
    return response.data;
};
