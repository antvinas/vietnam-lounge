// apps/web/src/features/plan/components/plan/TripInfoEditor.tsx
import React, { useEffect, useState } from "react";
import { usePlanStore } from "@/features/plan/stores/plan.store";

type TripInfoEditorProps = {
  open: boolean;
  onClose: () => void;
};

const TripInfoEditor: React.FC<TripInfoEditorProps> = ({ open, onClose }) => {
  const { currentTripId, trip } = usePlanStore((state) => {
    const id = state.currentTripId;
    return {
      currentTripId: id,
      trip: id ? state.trips[id] : null,
    };
  });

  const [draftTitle, setDraftTitle] = useState("");
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftNights, setDraftNights] = useState(1);
  const [draftTravelers, setDraftTravelers] = useState(1);
  const [draftCurrency, setDraftCurrency] = useState("VND");
  const [draftBudget, setDraftBudget] = useState(0);

  // 모달 열릴 때마다 현재 trip 메타를 로컬 state로 복사
  useEffect(() => {
    if (!open || !trip) return;

    setDraftTitle(trip.title ?? "");
    setDraftStartDate(trip.startDateISO ?? "");
    setDraftNights(trip.nights ?? 1);
    // travelerCount는 아직 타입에 없을 수 있으므로 any로 안전하게 처리
    setDraftTravelers((trip as any).travelerCount ?? 1);
    setDraftCurrency(trip.currency ?? "VND");
    setDraftBudget(trip.budgetTotal ?? 0);
  }, [open, trip]);

  if (!open || !currentTripId || !trip) {
    return null;
  }

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSave = () => {
    if (!currentTripId || !trip) return;

    const safeNights = Math.max(1, draftNights);
    const safeTravelers = Math.max(1, draftTravelers);
    const safeBudget = Math.max(0, draftBudget);

    const nextTitle = (draftTitle ?? "").trim() || trip.title || "";
    const nextStartDate = draftStartDate || trip.startDateISO;
    const nextCurrency = draftCurrency || trip.currency;

    const {
      setTripTitle,
      setTripDates,
      setTripCurrency,
      setTripBudget,
    } = usePlanStore.getState();

    // 1) Trip 메타 업데이트 (제목, 날짜, 숙박수, 통화, 예산)
    setTripTitle(currentTripId, nextTitle);
    setTripDates(currentTripId, nextStartDate, safeNights);
    setTripCurrency(currentTripId, nextCurrency);
    setTripBudget(currentTripId, safeBudget);

    // 2) travelerCount 는 아직 전역 타입 정의에 없을 수 있으므로
    //    기존 trips 맵에 부가 필드 형태로만 저장
    usePlanStore.setState((prev: any) => {
      const existing = prev.trips[currentTripId];
      if (!existing) return prev;
      return {
        ...prev,
        trips: {
          ...prev.trips,
          [currentTripId]: {
            ...existing,
            travelerCount: safeTravelers,
          },
        },
      };
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center bg-black/50 px-4 pt-20"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-2xl p-6 shadow-lg dark:bg-gray-900">
        {/* 헤더 */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            여행 정보 수정
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            출발일, 숙박 수, 인원, 예산 등을 설정해 주세요.
          </p>
        </div>

        {/* 본문 폼 */}
        <div className="space-y-5">
          {/* 여행 이름 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              여행 이름
            </label>
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
              placeholder="예: 하노이 2박 3일 여행"
            />
          </div>

          {/* 출발일 / 숙박 수 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                출발일
              </label>
              <input
                type="date"
                value={draftStartDate}
                onChange={(e) => setDraftStartDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                숙박 수
              </label>
              <input
                type="number"
                min={1}
                value={draftNights}
                onChange={(e) =>
                  setDraftNights(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
              />
            </div>
          </div>

          {/* 인원 / 통화 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                인원
              </label>
              <input
                type="number"
                min={1}
                value={draftTravelers}
                onChange={(e) =>
                  setDraftTravelers(Math.max(1, Number(e.target.value) || 1))
                }
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                통화
              </label>
              <select
                value={draftCurrency}
                onChange={(e) => setDraftCurrency(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
              >
                <option value="VND">VND</option>
                <option value="KRW">KRW</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* 총 예산 */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              총 예산
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={draftBudget}
                onChange={(e) =>
                  setDraftBudget(Math.max(0, Number(e.target.value) || 0))
                }
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {draftCurrency}
              </span>
            </div>
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripInfoEditor;
