// apps/web/src/components/map/types.ts

export type LatLng = { lat: number; lng: number };

export type Marker = LatLng & {
  id: string;
  label?: string;
  /** Marker tooltip/title 등에 사용 */
  title?: string;
};

export type MapClickPayload = LatLng & {
  /** 클릭한 위치의 주소(가능한 경우만) */
  address?: string;
};
