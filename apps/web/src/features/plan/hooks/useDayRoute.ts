// apps/web/src/features/plan/hooks/useDayRoute.ts

import { useMemo } from "react";
import { usePlanStore } from "@/store/plan.store";

type AnyItem = {
  id: string;
  dayId: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  timeStartMin?: number;
  order?: number;
  sortIndex?: number;
};

type Point = { lat: number; lng: number };

function haversineKm(a: Point, b: Point) {
  // Haversine formula
  const R = 6371; // km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export function useDayRoute(dayId: string | null) {
  const places = usePlanStore((s) => (s as any).places) as Record<string, { lat: number; lng: number }>;
  const itemsMap = usePlanStore((s) => (s as any).items) as Record<string, AnyItem>;
  const days = usePlanStore((s) => (s as any).days) as Record<string, any>;

  return useMemo(() => {
    if (!dayId) {
      return { points: [] as Point[], distanceKmTotal: 0, durationSecTotal: 0 };
    }

    // 1) day.itemIds가 있으면 그 순서를 우선 사용
    const day = days?.[dayId];
    const itemIds: string[] = Array.isArray(day?.itemIds) ? day.itemIds : [];

    let items: AnyItem[] = [];
    if (itemIds.length) {
      items = itemIds.map((id) => itemsMap?.[id]).filter(Boolean) as AnyItem[];
    } else {
      items = (Object.values(itemsMap ?? {}) as AnyItem[])
        .filter((it) => it.dayId === dayId)
        .filter((it) => !!it.placeId || (typeof it.lat === "number" && typeof it.lng === "number"));

      // 타임/정렬 키가 있으면 안정적으로 정렬
      const getSortKey = (it: AnyItem) =>
        it.order ?? it.sortIndex ?? (typeof it.timeStartMin === "number" ? it.timeStartMin : Number.MAX_SAFE_INTEGER);

      items = items.slice().sort((a, b) => getSortKey(a) - getSortKey(b));
    }

    // 2) points 구성
    const points: Point[] = [];
    for (const it of items) {
      if (it.placeId) {
        const p = places?.[it.placeId];
        if (p && typeof p.lat === "number" && typeof p.lng === "number") {
          points.push({ lat: p.lat, lng: p.lng });
        }
      } else if (typeof it.lat === "number" && typeof it.lng === "number") {
        points.push({ lat: it.lat, lng: it.lng });
      }
    }

    // 3) 이동거리/시간(대략) 계산
    let distanceKmTotal = 0;
    for (let i = 1; i < points.length; i++) {
      distanceKmTotal += haversineKm(points[i - 1], points[i]);
    }

    // 베트남 도심 평균 주행 속도(대략) 25km/h 기준
    const avgKmh = 25;
    const durationSecTotal = distanceKmTotal > 0 ? Math.round((distanceKmTotal / avgKmh) * 3600) : 0;

    return { points, distanceKmTotal, durationSecTotal };
  }, [dayId, itemsMap, places, days]);
}
