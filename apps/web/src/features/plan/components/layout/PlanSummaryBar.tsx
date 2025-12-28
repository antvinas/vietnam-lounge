// apps/web/src/features/plan/components/layout/PlanSummaryBar.tsx

import React from "react";
import {
  usePlanStore,
  selectCurrentTrip,
  selectDaysOfTrip,
  selectItemsOfDay,
  selectConflictsOfDay,
} from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { buildGoogleDirectionsUrl } from "@/lib/googleDirections";
import { useDayRoute } from "@/features/plan/hooks/useDayRoute";

export default function PlanSummaryBar() {
  const trip = usePlanStore(selectCurrentTrip);
  const days = usePlanStore((s) => selectDaysOfTrip(s, trip?.id)) || [];
  const currentDayId = usePlanUIStore((s) => s.currentDayId) ?? days[0]?.id ?? null;

  // 예산 계산 (zustand equalityFn 경고 방지: useStoreWithEqualityFn 사용)
  const { currency, budgetTotal, budgetSpent, budgetLeft } = useStoreWithEqualityFn(
    usePlanStore,
    (s) => {
      const id = trip?.id ?? s.currentTripId ?? "";
      const spent = Object.values(s.items)
        .filter((it: any) => it.tripId === id)
        .reduce((a, it: any) => a + (it.cost ?? 0), 0);
      const total = s.trips[id]?.budgetTotal ?? 0;
      return {
        currency: s.trips[id]?.currency ?? "VND",
        budgetTotal: total,
        budgetSpent: spent,
        budgetLeft: Math.max(0, total - spent),
      };
    },
    shallow,
  );

  const budgetPercent = budgetTotal > 0 ? Math.min(100, (budgetSpent / budgetTotal) * 100) : 0;
  const isBudgetOver = budgetTotal > 0 && budgetSpent > budgetTotal;

  // Day 정보 및 충돌
  const { conflictCount, dayPoints } = useStoreWithEqualityFn(
    usePlanStore,
    (s) => {
      if (!currentDayId) {
        return { conflictCount: 0, dayPoints: [] as { lat: number; lng: number }[] };
      }
      const items = selectItemsOfDay(s, currentDayId);
      const conflicts = selectConflictsOfDay(s, currentDayId);
      const places = s.places || {};
      const points = items
        .map((it: any) => {
          if (!it.placeId) return null;
          const p = places[it.placeId];
          if (!p || typeof p.lat !== "number" || typeof p.lng !== "number") return null;
          return { lat: p.lat, lng: p.lng };
        })
        .filter((p): p is { lat: number; lng: number } => !!p);

      return { conflictCount: conflicts.length, dayPoints: points };
    },
    shallow,
  );

  const { durationSecTotal } = useDayRoute(currentDayId);
  const travelMinutesDisplay =
    typeof durationSecTotal === "number" && durationSecTotal > 0 ? Math.round(durationSecTotal / 60) : 0;

  const canOpenDirections = !!trip && !!currentDayId && dayPoints.length >= 2;

  const handleOpenDayDirections = () => {
    if (!trip || !currentDayId || dayPoints.length < 2) return;
    const origin = dayPoints[0];
    const destination = dayPoints[dayPoints.length - 1];
    const waypoints = dayPoints.length > 2 ? dayPoints.slice(1, -1) : undefined;
    const url = buildGoogleDirectionsUrl({
      origin,
      destination,
      waypoints,
      travelMode: "driving",
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const currentTripId = usePlanStore((s) => s.currentTripId);
  const deleteTrip = usePlanStore((s) => s.deleteTrip);
  const resetUI = usePlanUIStore((s) => s.reset);

  const handleDeleteCurrentTrip = () => {
    if (!currentTripId) return;
    if (!window.confirm("현재 여행 일정을 모두 삭제하고 메인 화면으로 돌아갈까요?")) return;
    deleteTrip(currentTripId);
    resetUI();
  };

  if (!trip) return null;

  return (
    <div className="flex w-full items-center justify-between gap-4">
      {/* [UI 개선] 예산 섹션: 박스형 디자인 + 큰 폰트 */}
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg shadow-sm dark:bg-slate-700">
          💰
        </div>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">남은 예산</span>
            <span
              className={`text-sm font-bold ${
                isBudgetOver ? "text-rose-500" : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {budgetLeft.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">{currency}</span>
          </div>
          {/* 미니 게이지 바 */}
          <div className="relative mt-0.5 h-1 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-600">
            <div
              className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                isBudgetOver ? "bg-rose-500" : "bg-emerald-500"
              }`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
        </div>
        <div className="hidden flex-col border-l border-slate-200 pl-3 text-[10px] text-slate-400 dark:border-slate-700 sm:flex">
          <span>총 {budgetTotal.toLocaleString()}</span>
          <span>쓴돈 {budgetSpent.toLocaleString()}</span>
        </div>
      </div>

      {/* 우측: 액션 버튼 그룹 */}
      <div className="flex items-center gap-2">
        {currentDayId && travelMinutesDisplay > 0 && (
          <div className="hidden items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:flex">
            <span>🚗</span>
            <span>{travelMinutesDisplay}분 이동</span>
          </div>
        )}

        {conflictCount > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
            <span>⚠️ 겹침 {conflictCount}</span>
          </div>
        )}

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

        {canOpenDirections && (
          <button
            type="button"
            onClick={handleOpenDayDirections}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            🗺 지도 보기
          </button>
        )}

        {currentTripId && (
          <button
            type="button"
            onClick={handleDeleteCurrentTrip}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            🗑 삭제
          </button>
        )}
      </div>
    </div>
  );
}
