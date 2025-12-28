// src/components/plan/TripInfoHeader.tsx
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { usePlanStore, selectDaysOfTrip, selectItemsOfDay } from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";
import TripInfoEditor from "@/features/plan/components/plan/TripInfoEditor";

// 🟢 [추가] 유저 정보를 가져오기 위한 훅 임포트 (Auth Store 경로가 정확해야 함)
import { useAuthStore } from "@/features/auth/stores/auth.store";

function formatDateISO(date: Date) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(iso: string, days: number): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + days);
  return formatDateISO(d);
}

export default function TripInfoHeader() {
  const currentTripId = usePlanStore((s: any) => s.currentTripId);
  const trip = usePlanStore((s: any) =>
    s.currentTripId ? s.trips[s.currentTripId] : undefined,
  );
  
  // 🟢 [추가] 스토어 액션 및 유저 정보 가져오기
  const saveTripToServer = usePlanStore((s) => s.saveTripToServer);
  const user = useAuthStore((s) => s.user); // Auth store 구조에 따라 user 혹은 currentUser

  // (만약 Auth Store가 없다면 임시로 주석 처리 후 테스트)
  // const user = { uid: "test-user-id" };

  const [isSaving, setIsSaving] = useState(false);

  const currentDayId = usePlanUIStore((s: any) => s.currentDayId);
  const items = usePlanStore((s: any) => selectItemsOfDay(s, currentDayId));
  
  // 예산 계산 로직 (기존 유지)
  const budgetSummary = useMemo(() => {
    if (!trip) return { total: 0, planned: 0, left: 0, currency: "VND" };
    const days = selectDaysOfTrip(usePlanStore.getState(), trip.id);
    let planned = 0;
    days.forEach((d) => {
      d.itemIds.forEach((itemId) => {
        const it = usePlanStore.getState().items[itemId];
        if (it?.cost) planned += it.cost;
      });
    });
    const total = trip.budgetTotal ?? 0;
    return {
      total,
      planned,
      left: total - planned,
      currency: trip.currency,
    };
  }, [trip, items]); // items 변경시 재계산

  if (!trip) return null;

  const totalLabel = budgetSummary.total.toLocaleString();
  const plannedLabel = budgetSummary.planned.toLocaleString();
  const leftLabel = budgetSummary.left.toLocaleString();

  // 🟢 [추가] 저장 핸들러
  const handleSave = async () => {
      if(!user?.uid) {
          toast.error("로그인이 필요합니다.");
          return;
      }
      setIsSaving(true);
      await saveTripToServer(trip.id, user.uid);
      setIsSaving(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="mx-auto max-w-screen-xl">
        <div className="flex items-start justify-between">
          <div>
            <TripInfoEditor tripId={trip.id} />
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{trip.startDateISO}</span>
              <span>•</span>
              <span>{trip.nights}박 {trip.nights + 1}일</span>
              {trip.isSample && (
                  <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                    Sample
                  </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 🟢 [추가] 클라우드 저장 버튼 */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
            >
              {isSaving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1 dark:bg-zinc-800">
            <span className="font-medium text-gray-500 dark:text-gray-400">총 예산</span>
            <span className="font-bold tabular-nums text-gray-900 dark:text-white">
              {totalLabel} {budgetSummary.currency}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1 dark:bg-zinc-800">
            <span className="font-medium text-gray-500 dark:text-gray-400">예상 지출</span>
            <span className="font-bold tabular-nums text-red-600 dark:text-red-400">
              {plannedLabel} {budgetSummary.currency}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-2 py-1 dark:bg-emerald-900/20">
            <span className="font-medium text-emerald-700 dark:text-emerald-400">남은 예산</span>
            <span className="font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {leftLabel} {budgetSummary.currency}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}