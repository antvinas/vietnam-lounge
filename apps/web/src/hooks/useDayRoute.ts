// apps/web/src/hooks/useDayRoute.ts

import { useEffect, useMemo, useState } from "react";
import { shallow } from "zustand/shallow";
import { usePlanStore } from "@/store/plan.store";
import { usePlanUIStore } from "@/store/plan.ui.store";
import {
  getRoute,
  LatLngLiteral,
  DayRouteResult,
} from "@/lib/googleDirections";

export type DayRoutePoint = {
  id: string;
  lat: number;
  lng: number;
  title?: string;
};

export type UseDayRouteResult = {
  dayId: string | null;
  /** Day 아이템 순서대로 정렬된 포인트들 (마커용) */
  points: DayRoutePoint[];
  /** Google Directions 가 있으면 해당 polyline, 없으면 points 기반 직선 경로 */
  routePath: LatLngLiteral[];
  /** Directions 호출 중인지 여부 */
  loading: boolean;
  /** 전체 이동 거리(미터) – 있으면 PlanSummary 등에서 활용 가능 */
  distanceMetersTotal?: number;
  /** 전체 이동 시간(초 단위) */
  durationSecTotal?: number;
};

export function useDayRoute(): UseDayRouteResult {
  const dayId =
    usePlanUIStore((s) => s.currentDayId) ?? null;

  const { items, places } = usePlanStore(
    (s: any) => ({
      items: s.items,
      places: s.places,
    }),
    shallow
  );

  // 1) 현재 Day 기준 포인트 수집
  const points: DayRoutePoint[] = useMemo(() => {
    if (!dayId) return [];
    const dayItems = Object.values(items ?? {})
      .filter((it: any) => it.dayId === dayId)
      .sort(
        (a: any, b: any) =>
          (a.timeStartMin ?? 0) - (b.timeStartMin ?? 0)
      );

    const pts: DayRoutePoint[] = [];
    for (const it of dayItems) {
      const p = places?.[it.placeId ?? ""];
      const lat = Number(p?.lat);
      const lng = Number(p?.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        pts.push({
          id: it.id as string,
          lat,
          lng,
          title: it.title as string,
        });
      }
    }
    return pts;
  }, [dayId, items, places]);

  // 2) Directions + Polyline 상태
  const [routePath, setRoutePath] = useState<LatLngLiteral[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [distTotal, setDistTotal] = useState<
    number | undefined
  >(undefined);
  const [durTotal, setDurTotal] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;

    // 포인트가 2개 미만이면 경로 없음
    if (!dayId || points.length < 2) {
      setRoutePath([]);
      setLoading(false);
      setDistTotal(undefined);
      setDurTotal(undefined);
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        const origin: LatLngLiteral = {
          lat: points[0].lat,
          lng: points[0].lng,
        };
        const destination: LatLngLiteral = {
          lat: points[points.length - 1].lat,
          lng: points[points.length - 1].lng,
        };
        const waypoints: LatLngLiteral[] =
          points.length > 2
            ? points.slice(1, -1).map((p) => ({
                lat: p.lat,
                lng: p.lng,
              }))
            : [];

        const res: DayRouteResult | null = await getRoute({
          origin,
          destination,
          waypoints,
          travelMode: "DRIVING",
        });

        if (cancelled) return;

        if (!res || !res.path || res.path.length < 2) {
          // Directions 실패 시 → 단순 직선 경로로 fallback
          setRoutePath(points.map((p) => ({ lat: p.lat, lng: p.lng })));
          setDistTotal(undefined);
          setDurTotal(undefined);
        } else {
          setRoutePath(res.path);
          setDistTotal(res.distanceMetersTotal);
          setDurTotal(res.durationSecTotal);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[useDayRoute] getRoute 실패:", e);
          setRoutePath(points.map((p) => ({ lat: p.lat, lng: p.lng })));
          setDistTotal(undefined);
          setDurTotal(undefined);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [dayId, points]);

  return {
    dayId,
    points,
    routePath,
    loading,
    distanceMetersTotal: distTotal,
    durationSecTotal: durTotal,
  };
}
