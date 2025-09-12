
import { collection, getDocs, doc, getDoc, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Event } from "../types/event";

const eventsCollection = collection(db, "events");

/**
 * Fetches all events from the Firestore 'events' collection.
 */
export const getEvents = async (): Promise<Event[]> => {
  
  try {
    const eventSnapshot = await getDocs(eventsCollection);
    const eventList = eventSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Event, 'id'>),
    }));
    return eventList;
  } catch (error) {
    console.error("Error fetching events from Firestore:", error);
    return [];
  }
};

/**
 * Fetches a single event by its ID from Firestore.
 */
export const getEventById = async (id: string): Promise<Event | null> => {
  
  try {
    const eventDoc = doc(db, "events", id);
    const eventSnapshot = await getDoc(eventDoc);

    if (eventSnapshot.exists()) {
      return { id: eventSnapshot.id, ...eventSnapshot.data() } as Event;
    } else {
      console.warn(`Event with id ${id} not found.`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching event ${id}:`, error);
    return null;
  }
};

/**
 * Adds a new event to the Firestore 'events' collection.
 */
export const addEvent = async (event: Omit<Event, 'id'>): Promise<string> => {
    
    try {
        const docRef = await addDoc(eventsCollection, event);
        return docRef.id;
    } catch (error) {
        console.error("Error adding event to Firestore:", error);
        throw new Error('Failed to add event');
    }
};

/**
 * Fetches upcoming events.
 */
export const fetchUpcomingEvents = async (): Promise<Event[]> => {
  const response = await api.get('/events/upcoming');
  return response.data;
};
