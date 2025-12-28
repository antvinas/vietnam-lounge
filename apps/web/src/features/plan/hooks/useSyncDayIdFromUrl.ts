// apps/web/src/features/plan/hooks/useSyncDayIdFromUrl.ts

import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type DayLike = { id: string };

type Params = {
  enabled: boolean;
  currentDayId: string | null;
  daysOfCurrentTrip: DayLike[];
  setCurrentDayId: (dayId: string | null) => void;
  /**
   * URL을 /plan 로 고정할지 여부
   * - true: 항상 /plan?dayId=... 로 정리 (기본)
   * - false: 현재 pathname 유지한 채 query만 수정
   */
  forcePlanPathname?: boolean;
};

export function useSyncDayIdFromUrl({
  enabled,
  currentDayId,
  daysOfCurrentTrip,
  setCurrentDayId,
  forcePlanPathname = true,
}: Params): string | null {
  const location = useLocation();
  const navigate = useNavigate();

  const urlDayId = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get("dayId");
  }, [location.search]);

  const validDayIds = useMemo(() => {
    return new Set(daysOfCurrentTrip.map((d) => d.id));
  }, [daysOfCurrentTrip]);

  const effectiveDayId = useMemo(() => {
    if (!enabled) return null;

    // 1) URL dayId가 유효하면 그걸 사용
    if (urlDayId && validDayIds.has(urlDayId)) return urlDayId;

    // 2) UI store currentDayId가 유효하면 그걸 유지
    if (currentDayId && validDayIds.has(currentDayId)) return currentDayId;

    // 3) 둘 다 아니면 첫 day로 fallback
    const first = daysOfCurrentTrip[0]?.id ?? null;
    return first && validDayIds.has(first) ? first : null;
  }, [enabled, urlDayId, currentDayId, daysOfCurrentTrip, validDayIds]);

  useEffect(() => {
    if (!enabled) return;
    if (!effectiveDayId) return;

    // A) UI Store 동기화
    if (currentDayId !== effectiveDayId) {
      setCurrentDayId(effectiveDayId);
    }

    // B) URL 동기화 (invalid/missing -> replace)
    if (urlDayId !== effectiveDayId) {
      const sp = new URLSearchParams(location.search);
      sp.set("dayId", effectiveDayId);

      const nextPathname = forcePlanPathname ? "/plan" : location.pathname;
      navigate(
        { pathname: nextPathname, search: `?${sp.toString()}` },
        { replace: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, effectiveDayId]);

  return effectiveDayId;
}
