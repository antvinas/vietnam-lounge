// apps/web/src/components/plan/FABGroup.tsx

import React, { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlanUIStore } from "@/store/plan.ui.store";

type Props = { onAddPlace?: () => void };

/** 모바일용 FAB: 일정 시트 열기 + 장소 추가 */
export default function FABGroup({ onAddPlace }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentDayId = usePlanUIStore((s) => s.currentDayId);
  const setPlanSheetOpen = usePlanUIStore((s) => s.setPlanSheetOpen);

  // 기본 장소 추가 동작: 현재 Day 기준으로 검색 페이지로 이동
  const defaultAddPlace = useCallback(() => {
    if (!currentDayId) {
      window.alert("먼저 일정을 선택한 뒤 장소를 추가해 주세요.");
      return;
    }

    const searchPath = `/plan/search?dayId=${encodeURIComponent(
      String(currentDayId)
    )}`;

    navigate(searchPath, {
      state: { backgroundLocation: location, background: location },
    });
  }, [currentDayId, navigate, location]);

  const handleAddPlace = onAddPlace ?? defaultAddPlace;

  // 오늘 일정 bottom sheet 열기
  const openSheet = () => {
    setPlanSheetOpen(true);
  };

  return (
    <div className="fixed right-4 bottom-4 flex flex-col items-end gap-3 md:hidden">
      {/* 오늘 일정 시트 열기 */}
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full border bg-white text-xs shadow-md dark:border-gray-700 dark:bg-gray-900"
        onClick={openSheet}
        aria-label="오늘 일정 시트 열기"
        title="오늘 일정"
      >
        📅
      </button>

      {/* 장소 추가 */}
      <button
        type="button"
        className="btn btn-primary rounded-full shadow-lg"
        onClick={handleAddPlace}
        aria-label="+ 장소 추가"
        title="+ 장소 추가"
      >
        +
      </button>
    </div>
  );
}
