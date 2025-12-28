import React from "react";
import { 
  usePlanStore, 
  selectCurrentTrip, 
} from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

// 일정 리스트 컴포넌트
import DaySchedule from "@/features/plan/components/plan/DaySchedule";

export default function DaySidebar() {
  const trip = usePlanStore(selectCurrentTrip);
  const currentDayId = usePlanUIStore((s: any) => s.currentDayId);

  if (!trip) {
    return <div className="p-4 text-sm text-gray-500">여행 정보 로딩 중...</div>;
  }

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800">
      
      {/* 🔴 [삭제됨] 중복되던 '1일차 12/18' 탭 영역 제거함 */}
      
      {/* 하단: 일정 리스트 (DaySchedule)만 꽉 차게 표시 */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {currentDayId ? (
          <DaySchedule dayId={currentDayId} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-gray-400">
            <p>날짜를 선택하면<br />일정이 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}