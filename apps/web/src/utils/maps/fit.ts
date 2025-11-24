import { getFitPadding } from "./fitPadding";

export const DEFAULT_CENTER = { lat: 21.0278, lng: 105.8342 }; // 하노이
export const DEFAULT_ZOOM = 11;

// 기본 패딩(동적 상단 여백 미적용 시)
export const FIT_PADDING: google.maps.Padding = { top: 72, right: 48, bottom: 48, left: 48 };

type MaybePadding = number | google.maps.Padding;

/** 포인트 배열 기준으로 보기 영역 맞춤 */
export function fitToPoints(
  map: google.maps.Map,
  pts: Array<{ lat: number; lng: number }>,
  padding: MaybePadding = FIT_PADDING
) {
  if (!map) return;

  if (pts.length === 0) {
    map.setOptions({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
    return;
  }
  if (pts.length === 1) {
    map.setOptions({ center: pts[0], zoom: 14 });
    return;
  }

  const bounds = new google.maps.LatLngBounds();
  pts.forEach((p) => bounds.extend(p));
  map.fitBounds(bounds, padding as any);
}

/**
 * 상단 요약바 높이를 반영해 패딩을 동적으로 계산하여 맞춤
 * - summaryEl: 상단 sticky 바 element (ex. document.getElementById('plan-summary'))
 */
export function fitToPointsWithTopInset(
  map: google.maps.Map,
  pts: Array<{ lat: number; lng: number }>,
  summaryEl?: HTMLElement | null,
  base: Partial<google.maps.Padding> = { right: 16, bottom: 16, left: 16 },
  extraTop = 16
) {
  const pad = getFitPadding({
    topElement: summaryEl ?? undefined,
    extraTop,
    right: base.right,
    bottom: base.bottom,
    left: base.left,
  });
  fitToPoints(map, pts, pad);
}
