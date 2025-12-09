// src/types/plan.ts

export type TransportMode = "walk" | "car" | "transit" | "bike";
export type ItemType = "spot" | "food" | "spa" | "activity" | "custom";

/**
 * Place = 위치에 대한 단일 진실(Single Source of Truth)
 *
 * - lat/lng 는 필수 좌표
 * - googlePlaceId 및 주소/타입 정보 포함
 * - 기존 source/spotId/poiId 는 하위 호환을 위해 남겨둠
 */
export interface Place {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;

  /** Google Places place_id */
  googlePlaceId?: string;

  /** 포맷된 전체 주소 */
  formattedAddress?: string;

  /** Google place types (restaurant, point_of_interest 등) */
  types?: string[];

  /** 도시/국가 코드 등 추가 메타데이터 */
  city?: string;
  countryCode?: string;

  /** ── 기존 필드들 (하위 호환용) ─────────────────────── */

  /** 이 장소가 어디서 온 데이터인지 구분 */
  source?: "google" | "spot" | "poi";

  /** 우리 Firestore spots 컬렉션의 doc id (source === "spot" 일 때) */
  spotId?: string;

  /** 외부 POI API(OpenTripMap 등)의 고유 id (source === "poi" 일 때) */
  poiId?: string;
}

/**
 * 과거 코드 호환을 위해 PlaceLite 별칭 유지
 *  - 새 코드는 가급적 Place 를 직접 사용
 */
export type PlaceLite = Place;

/** Trip = 상위 개체 */
export interface Trip {
  id: string;
  startDateISO: string;
  nights: number;
  currency: string;
  budgetTotal: number;
  baseHotelId?: string;
  transportDefault: TransportMode;
  createdAt: string;
  updatedAt: string;
  /** 예시(샘플) 일정 여부 — persist에서 제외, 페이지 이탈 시 자동 정리 */
  isSample?: boolean;
}

/** Day = 날짜 단위 */
export interface Day {
  id: string;
  tripId: string;
  dateISO: string;
  order: number;
  budgetDaily?: number;
}

/** Item = 일정 블록 */
export interface Item {
  id: string;
  tripId: string;
  dayId: string;
  type: ItemType;
  title: string;

  /**
   * 방문 장소 참조
   *  - 앞으로는 필수로 가져가는 것을 목표로 하지만
   *    기존 데이터/샘플 때문에 일단 optional 유지
   */
  placeId?: string;

  timeStartMin?: number;
  timeEndMin?: number;
  cost?: number;
  notes?: string;
}

/** Link = 인접 아이템 간 이동 정보 */
export interface Link {
  id: string;
  tripId: string;
  fromItemId: string;
  toItemId: string;
  mode: TransportMode;
  distanceMeters?: number | null;
  durationSec?: number | null;
  cost?: number | null;
}

/** 파생 모델 */
export type Budget = {
  total: number;
  spent: number;
  left: number;
  dailyRecommended?: number;
};

export type Totals = {
  items: number;
  travelMin: number;
  distanceKm: number;
  cost: number;
};

export type Conflict = {
  a: Item;
  b: Item;
  reason: "time-overlap" | "closed-hours";
};

/** 유틸 타입 */
export type EntityMap<T extends { id: string }> = Record<string, T>;
