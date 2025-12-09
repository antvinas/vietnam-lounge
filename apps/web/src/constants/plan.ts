/** 교통 수단과 아이템 타입 정의(상수 중심). */
// NOTE: 타입 순환을 피하려고 store 타입을 import 하지 않는다.

export const TRANSPORT_MODES = ["walk", "car", "transit", "bike"] as const;
export type TransportMode = typeof TRANSPORT_MODES[number];

export const ITEM_TYPES = ["spot", "food", "spa", "activity", "custom"] as const;
export type ItemType = typeof ITEM_TYPES[number];

/** 기본 속도(km/h). 실제 API(거리/시간)로 대체 가능. */
export const DEFAULT_SPEED_KMH: Record<TransportMode, number> = {
  walk: 5,
  bike: 15,
  transit: 20,
  car: 30,
};

/** 일정 타임라인 기본값 */
export const DEFAULT_DAY_START_MIN = 9 * 60;     // 09:00
export const DEFAULT_BLOCK_MIN = 60;             // 기본 블록 60분
export const MIN_BLOCK_MIN = 30;                 // 최소 30분
export const DEFAULT_GAP_MIN = 15;               // 기본 간격 15분

/** 예산 경고 임계값 */
export const BUDGET_WARN_RATIO = 0.9;            // 90% 초과 시 경고

/** 세그먼트(이동 구간) 거리 임계값 */
export const SEGMENT_WARN_METERS = {
  walk: 3000,     // 3km 넘어가면 경고
  bike: 8000,
  transit: 20000,
  car: 50000,
} as const satisfies Record<TransportMode, number>;

/** 거리/시간 캐시 TTL(ms). 외부 Distance Matrix 사용 시 적용. */
export const DISTANCE_MATRIX_TTL_MS = 5 * 60 * 1000;

/** 운영시간 기본값(알 수 없음일 때 가정) */
export const DEFAULT_OPEN_MIN = 10 * 60;  // 10:00
export const DEFAULT_CLOSE_MIN = 20 * 60; // 20:00

/** 지도 패널 기본값 */
export const DEFAULT_VIEWPORT = {
  zoom: 12,
} as const;

/** UI 크기 기본값 */
export const DEFAULT_PANEL_PX = {
  left: 480,
  right: 720,
} as const;
