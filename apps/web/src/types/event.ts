export interface Event {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    date: string;
    location: string;
    category: string;
    organizer: string;
    gallery?: string[];
  }