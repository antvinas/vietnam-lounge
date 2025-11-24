// apps/web/src/components/plan/TripInfoEditor.tsx
import React, { useEffect, useMemo, useState } from "react";
import { usePlanStore } from "@/store/plan.store";

type TripInfoEditorProps = {
  open: boolean;
  onClose: () => void;
};

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

export default function TripInfoEditor({ open, onClose }: TripInfoEditorProps) {
  // ─────────────────────────────
  // 1) 스토어에서 Trip / 예산 정보 가져오기 (훅은 항상 호출)
  // ─────────────────────────────
  const { currentTripId, trip } = usePlanStore((s: any) => {
    const id = s.currentTripId;
    return {
      currentTripId: id,
      trip: id ? s.trips[id] : undefined,
    };
  });

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

  // ─────────────────────────────
  // 2) Trip 기반 “현재 설정 값” 계산
  // ─────────────────────────────
  const titleDefault: string = trip?.title || "제목 없는 여행";
  const startDateDefault: string = trip?.startDateISO || "";
  const nightsDefault: number =
    typeof trip?.nights === "number" && trip.nights > 0 ? trip.nights : 2;
  const daysDefault = nightsDefault + 1;
  const travelerCountDefault: number =
    typeof trip?.travelerCount === "number" && trip.travelerCount > 0
      ? trip.travelerCount
      : 1;

  const endDateDefault =
    startDateDefault !== "" ? addDays(startDateDefault, nightsDefault) : null;

  const currencyDefault: string =
    trip?.currency || budgetSummary.currency || "VND";
  const budgetTotalDefault: number =
    typeof trip?.budgetTotal === "number" && trip.budgetTotal > 0
      ? trip.budgetTotal
      : budgetSummary.totalBudget || 0;

  // ─────────────────────────────
  // 3) 편집용 draft 상태 (항상 같은 훅 개수/순서)
  // ─────────────────────────────
  const [draftTitle, setDraftTitle] = useState<string>(titleDefault);
  const [draftStartDate, setDraftStartDate] =
    useState<string>(startDateDefault);
  const [draftNights, setDraftNights] = useState<number>(nightsDefault);
  const [draftTravelerCount, setDraftTravelerCount] =
    useState<number>(travelerCountDefault);
  const [draftCurrency, setDraftCurrency] =
    useState<string>(currencyDefault);
  const [draftBudgetTotal, setDraftBudgetTotal] =
    useState<number>(budgetTotalDefault);

  // 모달이 열릴 때마다 현재 trip 값으로 draft 리셋
  useEffect(() => {
    if (!open) return;

    setDraftTitle(titleDefault);
    setDraftStartDate(startDateDefault);
    setDraftNights(nightsDefault);
    setDraftTravelerCount(travelerCountDefault);
    setDraftCurrency(currencyDefault);
    setDraftBudgetTotal(budgetTotalDefault);
  }, [
    open,
    titleDefault,
    startDateDefault,
    nightsDefault,
    travelerCountDefault,
    currencyDefault,
    budgetTotalDefault,
  ]);

  // 현재 설정 라벨
  const rangeLabel = useMemo(() => {
    if (!startDateDefault) return `${nightsDefault}박 ${daysDefault}일`;
    if (!endDateDefault)
      return `${nightsDefault}박 ${daysDefault}일 · ${startDateDefault}`;
    return `${nightsDefault}박 ${daysDefault}일 · ${startDateDefault} ~ ${endDateDefault}`;
  }, [startDateDefault, endDateDefault, nightsDefault, daysDefault]);

  const peopleLabel =
    travelerCountDefault === 1
      ? "1명"
      : `${travelerCountDefault.toLocaleString()}명`;

  // ─────────────────────────────
  // 4) 저장 처리 (스토어 업데이트)
  // ─────────────────────────────
  const handleSave = () => {
    if (!currentTripId || !trip) return;

    const safeNights = Math.max(1, draftNights || nightsDefault || 1);
    const safeTravelers = Math.max(
      1,
      draftTravelerCount || travelerCountDefault || 1
    );
    const safeBudget = Math.max(
      0,
      draftBudgetTotal || budgetTotalDefault || 0
    );

    usePlanStore.setState((state: any) => {
      const existing = state.trips[currentTripId];
      if (!existing) return state;

      return {
        ...state,
        trips: {
          ...state.trips,
          [currentTripId]: {
            ...existing,
            title: draftTitle || titleDefault,
            startDateISO: draftStartDate || startDateDefault,
            nights: safeNights,
            travelerCount: safeTravelers,
            currency: draftCurrency || currencyDefault,
            budgetTotal: safeBudget,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });

    onClose();
  };

  const handleBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // ─────────────────────────────
  // 5) 여기서만 조건부 렌더 (훅 호출 뒤라서 안전)
  // ─────────────────────────────
  if (!open || !currentTripId || !trip) {
    return null;
  }

  // ─────────────────────────────
  // 6) 렌더
  // ─────────────────────────────
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
    >
      <div className="flex w-full max-w-md flex-col rounded-lg bg-white p-5 shadow-lg dark:bg-gray-900 max-h-[90vh]">
        {/* 헤더 */}
        <div>
          <h2 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-50">
            여행 정보 수정
          </h2>
          <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
            현재 설정: {rangeLabel} · {peopleLabel}
          </p>
        </div>

        {/* 본문 (스크롤 가능 영역) */}
        <div className="mt-1 flex-1 overflow-y-auto">
          <div className="grid gap-4 text-sm">
            {/* 여행 기본 정보 섹션 */}
            <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
              <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                여행 기본 정보
              </h3>
              <div className="grid gap-3">
                {/* 제목 */}
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    여행 이름
                  </span>
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                    placeholder="예: 하노이 2박 3일 겨울 여행"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {/* 출발일 */}
                  <label className="grid gap-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      출발일
                    </span>
                    <input
                      type="date"
                      value={draftStartDate}
                      onChange={(e) => setDraftStartDate(e.target.value)}
                      className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                    />
                  </label>

                  {/* 숙박 수 */}
                  <label className="grid gap-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      숙박 수
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={draftNights}
                      onChange={(e) =>
                        setDraftNights(
                          Math.max(
                            1,
                            Number(e.target.value) || nightsDefault || 1
                          )
                        )
                      }
                      className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                    />
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                      예: 2박 → 3일 일정
                    </p>
                  </label>
                </div>

                {/* 인원수 */}
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    인원수
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={draftTravelerCount}
                    onChange={(e) =>
                      setDraftTravelerCount(
                        Math.max(1, Number(e.target.value) || 1)
                      )
                    }
                    className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                    placeholder="예: 2"
                  />
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    함께 여행하는 전체 인원 수를 입력해 주세요.
                  </p>
                </label>
              </div>
            </div>

            {/* 예산 설정 섹션 */}
            <div className="rounded-md border border-gray-200 p-3 dark:border-gray-700">
              <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                예산 설정
              </h3>
              <div className="grid grid-cols-[1fr_2fr] gap-2">
                {/* 통화 */}
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    통화
                  </span>
                  <select
                    value={draftCurrency}
                    onChange={(e) => setDraftCurrency(e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                  >
                    <option value="VND">VND</option>
                    <option value="KRW">KRW</option>
                    <option value="USD">USD</option>
                  </select>
                </label>

                {/* 총 예산 */}
                <label className="grid gap-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    총 예산
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={draftBudgetTotal}
                    onChange={(e) =>
                      setDraftBudgetTotal(
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50"
                  />
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    항공권은 제외한 현지 예산 기준, 1인 기준이면 메모에 따로
                    적어두면 좋아요.
                  </p>
                </label>
              </div>

              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                현재 예상 지출:{" "}
                {budgetSummary.plannedCost.toLocaleString()}{" "}
                {budgetSummary.currency} · 남은 예산:{" "}
                {budgetSummary.budgetLeft.toLocaleString()}{" "}
                {budgetSummary.currency}
              </p>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
