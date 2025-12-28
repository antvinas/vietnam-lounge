import React from "react";
// 🟢 [수정 1] 스토어에서 데이터 가져오는 도구 임포트
import { usePlanStore, selectItemsOfDay } from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

// 🟢 [수정 2] 이미 구현된 카드 컴포넌트 임포트 (PlaceName 에러 해결)
import PlanItemCard from "@/features/plan/components/plan/PlanItemCard";

type Props = {
  dayId?: string;
};

export default function DaySchedule({ dayId: propDayId }: Props) {
  // 1. 현재 선택된 날짜 ID 확보 (props가 없으면 스토어에서 가져옴)
  const currentDayId = usePlanUIStore((s: any) => s.currentDayId);
  const targetDayId = propDayId || currentDayId;

  // 2. 해당 날짜의 아이템 리스트 가져오기
  const items = usePlanStore((state) => 
    targetDayId ? selectItemsOfDay(state, targetDayId) : []
  );

  // 날짜가 선택되지 않았을 때
  if (!targetDayId) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        날짜를 선택해주세요.
      </div>
    );
  }

  // 아이템이 없을 때 (Empty State)
  if (!items || items.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500 dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="font-medium text-gray-900 dark:text-gray-100">일정이 비어있습니다</p>
        <p className="mt-1 text-xs opacity-70 dark:text-gray-400">
          지도에서 장소를 선택하거나<br />추천 일정을 추가해보세요
        </p>
      </div>
    );
  }

  // 3. 리스트 렌더링 (안전한 PlanItemCard 사용)
  return (
    <div className="flex flex-col gap-3 pb-20">
      {items.map((item, index) => (
        <PlanItemCard
          key={item.id}
          dayKey={targetDayId}
          block={item}
          index={index}
        />
      ))}
    </div>
  );
}