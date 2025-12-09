import React from "react";
import { Plus, Map, List, Save, Trash2 } from "lucide-react";

import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";
import { usePlanStore } from "@/features/plan/stores/plan.store";
import usePlanner from "@/features/plan/hooks/usePlanner";

interface FABGroupProps {
  onAddPlace?: () => void;
}

export function FABGroup({ onAddPlace }: FABGroupProps) {
  const currentDayId = usePlanUIStore((s) => s.currentDayId);
  const isPlanSheetOpen = usePlanUIStore((s) => s.isPlanSheetOpen);
  const setPlanSheetOpen = usePlanUIStore((s) => s.setPlanSheetOpen);

  const currentTripId = usePlanStore((s) => s.currentTripId);
  const deleteTrip = usePlanStore((s) => s.deleteTrip);
  const resetUI = usePlanUIStore((s) => s.reset);

  // CTA 공통 훅 (autosave 불필요, navigation 전용으로만 사용)
  const { goAddPlaceForCurrentDay } = usePlanner(undefined, {
    enableAutosave: false,
  });

  const handleAddPlace = onAddPlace ?? goAddPlaceForCurrentDay;

  const handleDeleteCurrentTrip = () => {
    if (!currentTripId) return;
    if (
      !window.confirm(
        "현재 여행 일정을 모두 삭제하고 메인 화면으로 돌아갈까요?",
      )
    ) {
      return;
    }
    deleteTrip(currentTripId);
    resetUI();
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3 md:hidden">
      {/* 현재 여행 삭제 (모바일 전용 작은 FAB) */}
      {currentTripId && (
        <button
          type="button"
          onClick={handleDeleteCurrentTrip}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white shadow-lg ring-1 ring-red-500/40"
          aria-label="현재 여행 삭제"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      {/* 지도 / 리스트 토글 */}
      <button
        type="button"
        onClick={() => setPlanSheetOpen(!isPlanSheetOpen)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-900"
        aria-label={isPlanSheetOpen ? "지도로 보기" : "오늘 일정 시트 열기"}
      >
        {isPlanSheetOpen ? (
          <Map className="h-5 w-5 text-gray-700 dark:text-gray-100" />
        ) : (
          <List className="h-5 w-5 text-gray-700 dark:text-gray-100" />
        )}
      </button>

      {/* 저장 버튼 (지금은 UI만, 실제 저장은 autosave/다른 흐름 사용) */}
      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg ring-1 ring-emerald-500/40"
        aria-label="일정 저장"
      >
        <Save className="h-5 w-5" />
      </button>

      {/* 장소 추가 */}
      <button
        type="button"
        onClick={handleAddPlace}
        disabled={!currentDayId}
        className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-lg ring-1 ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus className="mr-1 h-4 w-4" />
        장소 추가
      </button>
    </div>
  );
}
