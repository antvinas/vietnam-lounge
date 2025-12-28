
export interface Post {
  title: string;
  content: string;
  segment: string; // e.g., 'daylife', 'nightlife'
  tags: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  likeCount: number;
  commentCount: number;
  views: number;
}

export interface Comment {
  postId: string;
  content: string;
  author: string; // or a more complex user object
  createdAt: FirebaseFirestore.Timestamp;
}

export interface Spot {
  name: string;
  citySlug: string;
  category: string;
  lat: number;
  lon: number;
  likes: number;
  views: number;
  favorites: number;
}

export interface Event {
  title: string;
  startsAt: FirebaseFirestore.Timestamp;
  endsAt: FirebaseFirestore.Timestamp;
  hero: string; // URL to hero image
  coupons: string[]; // Array of coupon IDs
}

export interface KPI {
  dau: number;
  posts: number;
  revenue: number;
  conversionRate: number;
}
