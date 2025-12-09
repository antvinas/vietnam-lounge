// src/components/plan/TripInfoHeader.tsx
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { usePlanStore, selectDaysOfTrip } from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";
import TripInfoEditor from "@/features/plan/components/plan/TripInfoEditor";

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
  const duplicateTripAsUser = usePlanStore(
    (s: any) => s.duplicateTripAsUser,
  );

  const currentDayId = usePlanUIStore((s: any) => s.currentDayId);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // 예산 요약 계산
  const budgetSummary = usePlanStore((s: any) => {
    const tripId = s.currentTripId;
    if (!tripId) {
      return {
        currency: "VND",
        totalBudget: 0,
        plannedCost: 0,
        budgetLeft: 0,
      };
    }

    const tripObj = s.trips[tripId] || {};
    const currency = tripObj.currency || "VND";
    const totalBudget = tripObj.budgetTotal || 0;

    const plannedCost = Object.values(s.items)
      .filter((it: any) => it.tripId === tripId)
      .reduce((sum: number, it: any) => sum + (it.cost ?? 0), 0);

    const budgetLeft = Math.max(0, totalBudget - plannedCost);

    return { currency, totalBudget, plannedCost, budgetLeft };
  });

  // 현재 trip의 Day 리스트
  const daysOfTrip = usePlanStore((s: any) =>
    currentTripId ? selectDaysOfTrip(s, currentTripId) : [],
  );

  // 기간 라벨 (2박 3일 · 2025-11-24 ~ 2025-11-26)
  const rangeLabel = useMemo(() => {
    if (!trip) return "";
    const startDateISO: string | undefined = trip.startDateISO;
    const nights: number =
      typeof trip.nights === "number" ? (trip.nights as number) : 2;
    const days = nights + 1;
    const endDateISO =
      startDateISO != null ? addDays(startDateISO, nights) : null;

    if (!startDateISO) return `${nights}박 ${days}일`;
    if (!endDateISO) return `${nights}박 ${days}일 · ${startDateISO}`;
    return `${nights}박 ${days}일 · ${startDateISO} ~ ${endDateISO}`;
  }, [trip]);

  // "총 N일 중 오늘은 몇 일차인지" 라벨
  const dayContextLabel = useMemo(() => {
    if (!trip || !currentDayId || !daysOfTrip.length) return null;
    const total = daysOfTrip.length;
    const idx = (daysOfTrip as any[]).findIndex((d: any) => d.id === currentDayId);
    if (idx === -1) return null;
    return `총 ${total}일 중 ${idx + 1}일차`;
  }, [trip, currentDayId, daysOfTrip]);

  // 트립 정보가 없으면 아무것도 표시하지 않음
  if (!currentTripId || !trip) return null;

  const title: string = trip.title || "제목 없는 여행";
  const isSample: boolean = !!trip.isSample;

  const travelerCount: number =
    typeof trip.travelerCount === "number" && trip.travelerCount > 0
      ? trip.travelerCount
      : 1;
  const peopleLabel =
    travelerCount === 1 ? "1명" : `${travelerCount.toLocaleString()}명`;

  const totalLabel = budgetSummary.totalBudget.toLocaleString();
  const plannedLabel = budgetSummary.plannedCost.toLocaleString();
  const leftLabel = budgetSummary.budgetLeft.toLocaleString();

  const handleCopySample = async () => {
    if (!currentTripId || !isSample || isCopying) return;
    try {
      setIsCopying(true);
      await duplicateTripAsUser(currentTripId);
      toast.success("샘플 일정을 내 일정으로 복사했어요.");
    } catch (e: any) {
      toast.error("일정 복사에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <>
      {/* Trip Info 헤더 영역 (레이아웃/패딩은 상위에서 제어) */}
      <section className="flex w-full flex-col gap-1 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 truncate text-base font-semibold text-gray-900 dark:text-gray-50">
              <span className="truncate">{title}</span>
              {isSample && (
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">
                  샘플 일정
                </span>
              )}
            </h1>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {rangeLabel} · {peopleLabel}
            </p>
            {dayContextLabel && (
              <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                {dayContextLabel}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              ✏️ 여행 정보 수정
            </button>
            {isSample && (
              <button
                type="button"
                onClick={handleCopySample}
                disabled={isCopying}
                className="rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCopying ? "복사 중..." : "내 일정으로 복사하기"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 dark:bg-gray-800">
            <span className="font-medium">총 예산</span>
            <span className="tabular-nums">
              {totalLabel} {budgetSummary.currency}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 dark:bg-gray-800">
            <span className="font-medium">예상 지출</span>
            <span className="tabular-nums">
              {plannedLabel} {budgetSummary.currency}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100">
            <span className="font-medium">남은 예산</span>
            <span className="tabular-nums">
              {leftLabel} {budgetSummary.currency}
            </span>
          </span>
        </div>
      </section>

      {/* 여행 정보 수정 모달 */}
      <TripInfoEditor open={isEditorOpen} onClose={() => setIsEditorOpen(false)} />
    </>
  );
}
