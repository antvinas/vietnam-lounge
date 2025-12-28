// apps/web/src/hooks/usePlanDnd.ts
import { useCallback } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import { usePlanStore } from "@/features/plan/stores/plan.store";

/**
 * Day 타임라인에서 DnD로 순서 변경할 때 사용할 훅
 * - currentDayId 기준으로 moveItemWithinDay 호출
 */
export function useDayTimelineDnd(currentDayId: string | null) {
  const moveItemWithinDay = usePlanStore(
    (s: any) => s.moveItemWithinDay
  );

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!currentDayId) return;
      if (!moveItemWithinDay) return;

      const { source, destination } = result;
      if (!destination) return;
      if (source.droppableId !== destination.droppableId) return;
      if (source.index === destination.index) return;

      // 같은 Day 안에서 인덱스만 변경
      moveItemWithinDay(currentDayId, source.index, destination.index);
    },
    [currentDayId, moveItemWithinDay]
  );

  return { onDragEnd };
}
