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
 * ✅ 이 훅의 역할
 * - URL의 ?dayId= 와 UI store(currentDayId)를 "유효한 dayId"로 정규화/동기화
 * - (옵션) UI store에 selectedDayId가 존재하면 그것도 같이 맞춰줌
 *
 * 규칙
 * 1) Trip이 없으면: currentDayId/selectedDayId 및 URL dayId 제거
 * 2) Trip은 있는데 days가 없으면: currentDayId/selectedDayId 및 URL dayId 제거
 * 3) currentDayId가 없으면(초기 진입): URL dayId가 유효하면 사용, 아니면 첫 day 사용
 * 4) currentDayId가 있는데 유효하지 않으면: URL dayId(유효) → 첫 day 순서로 보정
 * 5) 항상 URL은 최종 effective dayId로 replace 동기화
 */
export function usePlanBootstrap() {
  const [searchParams, setSearchParams] = useSearchParams();

  const { currentTripId, currentTrip, daysOfCurrentTrip, hasTrip } =
    usePlanStore((state) => {
      const trip = selectCurrentTrip(state);
      const days = trip ? selectDaysOfTrip(state, trip.id) : [];

      return {
        currentTripId: trip ? trip.id : state.currentTripId ?? null,
        currentTrip: trip,
        daysOfCurrentTrip: days,
        hasTrip: !!trip,
      };
    });

  const currentDayId = usePlanUIStore((s) => s.currentDayId);
  const setCurrentDayId = usePlanUIStore((s) => s.setCurrentDayId);

  // ✅ 프로젝트마다 존재/이름이 다를 수 있어서 optional 처리 (타입 에러 방지)
  const selectedDayId = usePlanUIStore(
    (s: any) => (s?.selectedDayId as string | null) ?? null
  );
  const setSelectedDayId = usePlanUIStore(
    (s: any) =>
      s?.setSelectedDayId as ((id: string | null) => void) | undefined
  );

  useEffect(() => {
    const urlDayId = searchParams.get("dayId") || null;

    const replaceUrlDayId = (dayId: string | null) => {
      const next = new URLSearchParams(searchParams);
      if (!dayId) next.delete("dayId");
      else next.set("dayId", dayId);
      setSearchParams(next, { replace: true });
    };

    const setBothDayIds = (dayId: string | null) => {
      setCurrentDayId(dayId);
      if (typeof setSelectedDayId === "function") {
        setSelectedDayId(dayId);
      }
    };

    // Trip 이 없으면 Day 관련 상태/URL 전부 정리
    if (!hasTrip || !currentTripId) {
      if (currentDayId !== null || selectedDayId !== null) {
        setBothDayIds(null);
      }
      if (urlDayId) {
        replaceUrlDayId(null);
      }
      return;
    }

    // Trip은 있는데 Day가 하나도 없는 경우
    if (daysOfCurrentTrip.length === 0) {
      if (currentDayId !== null || selectedDayId !== null) {
        setBothDayIds(null);
      }
      if (urlDayId) {
        replaceUrlDayId(null);
      }
      return;
    }

    const validDayIds = new Set(daysOfCurrentTrip.map((d) => d.id));
    const firstDayId = daysOfCurrentTrip[0]?.id ?? null;

    // ① currentDayId 가 아직 없는 "초기 진입" 상황
    if (!currentDayId) {
      const initialId =
        urlDayId && validDayIds.has(urlDayId) ? urlDayId : firstDayId;

      if (!initialId) return;

      // UI store 세팅 (+ optional selectedDayId)
      if (currentDayId !== initialId || selectedDayId !== initialId) {
        setBothDayIds(initialId);
      }

      // URL도 정규화
      if (urlDayId !== initialId) {
        replaceUrlDayId(initialId);
      }
      return;
    }

    // ② currentDayId 가 이미 있는 상태
    //    -> currentDayId가 유효하면 유지
    //    -> 유효하지 않으면 URL(dayId 유효) → 첫 day 순서로 보정
    const effectiveId = validDayIds.has(currentDayId)
      ? currentDayId
      : urlDayId && validDayIds.has(urlDayId)
        ? urlDayId
        : firstDayId;

    if (!effectiveId) {
      // 안전용
      if (currentDayId !== null || selectedDayId !== null) {
        setBothDayIds(null);
      }
      if (urlDayId) {
        replaceUrlDayId(null);
      }
      return;
    }

    // store 업데이트
    if (
      effectiveId !== currentDayId ||
      (selectedDayId !== effectiveId && typeof setSelectedDayId === "function")
    ) {
      setBothDayIds(effectiveId);
    }

    // URL 업데이트
    if (urlDayId !== effectiveId) {
      replaceUrlDayId(effectiveId);
    }
  }, [
    hasTrip,
    currentTripId,
    daysOfCurrentTrip,
    currentDayId,
    selectedDayId,
    searchParams,
    setCurrentDayId,
    setSearchParams,
    setSelectedDayId,
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
