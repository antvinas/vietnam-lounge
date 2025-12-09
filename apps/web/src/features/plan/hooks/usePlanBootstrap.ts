// apps/web/src/features/plan/hooks/usePlanBootstrap.ts

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  usePlanStore,
  selectCurrentTrip,
  selectDaysOfTrip,
} from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

/**
 * Plan 화면 진입 시 Trip/Day/UI 상태를 정리해 주는 부트스트랩 훅
 *
 * 규칙
 * 1) source of truth = UI store 의 currentDayId
 * 2) 처음 들어올 때 currentDayId 가 비어 있으면:
 *    - URL ?dayId 가 유효하면 그걸 사용
 *    - 아니면 첫 번째 Day 사용
 * 3) 이후에는 currentDayId 가 바뀔 때마다 URL 의 ?dayId 를 맞춰준다.
 *    (URL 때문에 currentDayId 를 다시 덮어쓰지 않는다)
 */
export function usePlanBootstrap() {
  const [searchParams, setSearchParams] = useSearchParams();

  const { currentTripId, currentTrip, daysOfCurrentTrip, hasTrip } =
    usePlanStore((state) => {
      const currentTrip = selectCurrentTrip(state);
      const days = currentTrip ? selectDaysOfTrip(state, currentTrip.id) : [];
      const hasTrip = !!currentTrip;
      const currentTripId = currentTrip
        ? currentTrip.id
        : state.currentTripId ?? null;

      return {
        currentTripId,
        currentTrip,
        daysOfCurrentTrip: days,
        hasTrip,
      };
    });

  const currentDayId = usePlanUIStore((s) => s.currentDayId);
  const setCurrentDayId = usePlanUIStore((s) => s.setCurrentDayId);

  useEffect(() => {
    const urlDayId = searchParams.get("dayId") || null;

    // Trip 이 없으면 Day 관련 상태/URL 전부 정리
    if (!hasTrip || !currentTripId) {
      if (currentDayId) {
        setCurrentDayId(null);
      }
      if (urlDayId) {
        const next = new URLSearchParams(searchParams);
        next.delete("dayId");
        setSearchParams(next, { replace: true });
      }
      return;
    }

    const validDayIds = new Set(daysOfCurrentTrip.map((d) => d.id));
    const firstDayId = daysOfCurrentTrip[0]?.id ?? null;

    if (daysOfCurrentTrip.length === 0) {
      // Trip 은 있는데 Day 가 하나도 없는 경우
      if (currentDayId) {
        setCurrentDayId(null);
      }
      if (urlDayId) {
        const next = new URLSearchParams(searchParams);
        next.delete("dayId");
        setSearchParams(next, { replace: true });
      }
      return;
    }

    // ─────────────────────────────────────────────
    // ① currentDayId 가 아직 없는 "초기 진입" 상황
    // ─────────────────────────────────────────────
    if (!currentDayId) {
      let initialId: string | null = null;

      if (urlDayId && validDayIds.has(urlDayId)) {
        // URL 에 있는 dayId 가 현재 Trip 의 Day 라면 그걸 우선 사용
        initialId = urlDayId;
      } else {
        // 아니면 첫 번째 Day
        initialId = firstDayId;
      }

      if (!initialId) {
        return;
      }

      // UI store 세팅
      setCurrentDayId(initialId);

      // URL 도 정규화
      if (urlDayId !== initialId) {
        const next = new URLSearchParams(searchParams);
        next.set("dayId", initialId);
        setSearchParams(next, { replace: true });
      }

      return;
    }

    // ─────────────────────────────────────────────
    // ② currentDayId 가 이미 있는 상태 (사용자가 탭 클릭 등으로 변경 가능)
    //    -> currentDayId 를 기준으로 URL 을 맞춰준다.
    // ─────────────────────────────────────────────

    // currentDayId 가 더 이상 유효하지 않으면 첫 번째 Day 로 보정
    const effectiveId = validDayIds.has(currentDayId)
      ? currentDayId
      : firstDayId;

    if (!effectiveId) {
      // 이론상 거의 없는 케이스지만 안전용
      if (currentDayId) {
        setCurrentDayId(null);
      }
      if (urlDayId) {
        const next = new URLSearchParams(searchParams);
        next.delete("dayId");
        setSearchParams(next, { replace: true });
      }
      return;
    }

    // 보정된 값이 currentDayId 와 다르면 store 업데이트
    if (effectiveId !== currentDayId) {
      setCurrentDayId(effectiveId);
    }

    // URL 의 ?dayId 를 currentDayId(effectiveId) 에 맞춰준다
    if (urlDayId !== effectiveId) {
      const next = new URLSearchParams(searchParams);
      next.set("dayId", effectiveId);
      setSearchParams(next, { replace: true });
    }
  }, [
    hasTrip,
    currentTripId,
    daysOfCurrentTrip,
    currentDayId,
    searchParams,
    setCurrentDayId,
    setSearchParams,
  ]);

  return {
    hasTrip,
    currentTripId,
    currentTrip,
    currentDayId,
    daysOfCurrentTrip,
    setCurrentDayId,
  };
}
