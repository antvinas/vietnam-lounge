import { api } from "@/lib/api";
import { Event } from "@/types/event";

export const getEvents = async (isNight: boolean): Promise<Event[]> => {
  const segment = isNight ? "adult" : "general";
  try {
    const res = await api.get(`/events/${segment}`);
    return res.data;
  } catch {
    return [];
  }
};

export const getEventById = async (id: string, isNight: boolean): Promise<Event | null> => {
  const segment = isNight ? "adult" : "general";
  try {
    const res = await api.get(`/events/${segment}/${id}`);
    return res.data;
  } catch {
    return null;
  }
};

export const addEvent = async (event: Omit<Event, "id">, isNight: boolean): Promise<string> => {
  const segment = isNight ? "adult" : "general";
  const res = await api.post(`/events/${segment}`, event);
  return res.data.id;
};

export const deleteEvent = async (id: string, isNight: boolean): Promise<void> => {
  const segment = isNight ? "adult" : "general";
  await api.delete(`/events/${segment}/${id}`);
};

export const fetchUpcomingEvents = async (isNight: boolean): Promise<Event[]> => {
  const segment = isNight ? "adult" : "general";
  const res = await api.get(`/events/${segment}/upcoming`);
  return res.data;
};
