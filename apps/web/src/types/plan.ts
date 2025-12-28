// apps/web/src/types/plan.ts

export type TransportMode = "walk" | "car" | "transit" | "bike";

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  formattedAddress?: string;
  googlePlaceId?: string;
  source?: "user" | "google" | "template";
  types?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Item {
  id: string;
  tripId: string;
  dayId: string;
  type: "spot" | "meal" | "activity" | "etc";
  title: string;
  note?: string;

  // 🟢 시간/비용 필드 (호환성 확보)
  startTime?: string | null;
  endTime?: string | null;
  timeStartMin?: number | null;
  timeEndMin?: number | null;
  stayMinutes?: number | null;

  cost?: number | null;
  transportMode?: TransportMode;
  placeId?: string | null;

  lat?: number;
  lng?: number;
  order?: number;

  createdAt: string;
  updatedAt: string;
  category?: string;
}

export interface Link {
  id: string;
  tripId: string;
  fromItemId: string;
  toItemId: string;
  mode: TransportMode;
  distance?: number;
  duration?: number;
}

export interface Day {
  id: string;
  tripId: string;
  dateISO: string;
  order: number;
  itemIds: string[];
}

export interface Trip {
  id: string;
  title: string;
  startDateISO: string;
  nights: number;

  // 🟢 [필수] PlanOrchestrator 에러 해결
  dayIds: string[];

  /**
   * ✅ PDF export 쪽(Trip 타입)이 number | undefined를 기대하는 곳이 있어서 null 제거
   */
  budgetTotal?: number | null; 
  currency: string;
  transportDefault: TransportMode;
  baseHotelPlaceId?: string | null;

  isSample?: boolean;
  templateMeta?: any;

  createdAt: string;
  updatedAt: string;
}

export interface LinkMetrics {
  distanceMeters: number;
  durationSeconds: number;
  polyline?: string;
  mode: TransportMode;
}

export type EntityMap<T> = Record<string, T>;

export interface TripTemplateMeta {
  id: string;
  title: string;
  nights: number;
  city: string;
}

// 🟢 이동 수단 모드 (directionsClient 호환)
export type MoveMode = TransportMode;
