// apps/web/src/features/event/constants/eventTaxonomy.ts

/**
 * ✅ 이벤트 도메인(유저 EventList + Admin Add/Edit)에서 공통으로 쓰는 고정 값
 * - Firestore 저장값(value) 기준으로 관리합니다.
 * - 여기만 수정하면 유저/어드민 옵션이 동시에 맞춰집니다.
 */

export const EVENT_CITIES = [
  "Hanoi",
  "Ho Chi Minh City",
  "Da Nang",
  "Nha Trang",
  "Phu Quoc",
] as const;

export const EVENT_CATEGORIES = [
  "Festival",
  "Tour",
  "Food",
  "Music",
  "Nightlife",
] as const;

export type EventCity = (typeof EVENT_CITIES)[number];
export type EventCategory = (typeof EVENT_CATEGORIES)[number];
