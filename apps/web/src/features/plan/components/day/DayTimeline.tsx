// apps/web/src/components/plan/DayTimeline.tsx
import React, { useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

import TimelineItem from "@/features/plan/components/day/TimelineItem";

import {
  usePlanStore,
  selectItemsOfDay,
  selectConflictsOfDay,
} from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

type Props = {
  dayId?: string;
};

/**
 * DayTimeline
 * - 특정 Day의 아이템을 시간순으로 정렬해서 보여주는 타임라인
 * - 드래그로 순서 변경 가능
 */
export default function DayTimeline({ dayId }: Props) {
  const uiCurrentDayId = usePlanUIStore((s) => s.currentDayId);
  const activeDayId = dayId ?? uiCurrentDayId;

  const setSelectedItemId = usePlanUIStore((s) => s.setSelectedItemId);
  const setHoverSpotId = usePlanUIStore((s) => s.setHoverSpotId);

  const { rawItems, removeItem, addItem, moveItemWithinDay } = usePlanStore(
    (s) => ({
      rawItems: selectItemsOfDay(s, activeDayId),
      removeItem: s.removeItem,
      addItem: s.addItem,
      moveItemWithinDay: s.moveItemWithinDay,
    })
  );

  // conflicts가 undefined/null일 수 있으니 항상 배열로 안전하게 변환
  const conflicts = usePlanStore((s) =>
    selectConflictsOfDay(s, activeDayId ?? null) ?? []
  );

  const items = useMemo(() => {
    return rawItems
      .slice()
      .sort((a, b) => {
        const ta = a.timeStartMin ?? 0;
        const tb = b.timeStartMin ?? 0;
        if (ta === tb) return (a.order ?? 0) - (b.order ?? 0);
        return ta - tb;
      })
      .map((it, index) => {
        // 각 conflict가 제대로 된 구조인지 확인하고 includes 호출
        const conflict = conflicts.find(
          (c: any) =>
            c &&
            Array.isArray(c.itemIds) &&
            c.itemIds.includes(it.id)
        );

        return {
          id: it.id,
          index,
          title: it.title || "",
          category: it.category as string | undefined,
          timeStartMin: it.timeStartMin,
          timeEndMin: it.timeEndMin,
          stayMinutes: it.stayMinutes,
          cost: typeof it.cost === "number" ? it.cost : undefined,
          placeId: it.placeId,
          lat: it.lat,
          lng: it.lng,
          note: it.note as string | undefined,
          hasConflict: !!conflict,
        };
      });
  }, [rawItems, conflicts]);

  const handleItemClick = (id: string) => {
    setSelectedItemId(id);
  };

  const handleRemove = (id: string) => {
    if (!window.confirm("이 일정을 삭제할까요?")) return;
    removeItem(id);
  };

  const handleDuplicate = (id: string) => {
    const origin = rawItems.find((it) => it.id === id);
    if (!origin || !activeDayId) return;

    const copy = {
      ...origin,
      id: undefined,
      order: (origin.order ?? 0) + 0.1,
    } as any;

    addItem(activeDayId, copy);
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    if (!activeDayId) return;
    if (
      destination.droppableId !== source.droppableId ||
      destination.index === source.index
    ) {
      return;
    }

    moveItemWithinDay(activeDayId, source.index, destination.index);
  };

  if (!activeDayId) {
    return (
      <div className="py-6 text-center text-xs text-slate-400">
        Day를 먼저 선택해 주세요.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-3 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          아직 추가된 일정이 없습니다. 위의 <b>+ 장소 추가</b> 버튼으로
          일정을 시작해 보세요.
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={activeDayId}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex flex-col gap-2"
              >
                {items.map((it, index) => (
                  <Draggable key={it.id} draggableId={it.id} index={index}>
                    {(dragProvided, snapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                      >
                        <TimelineItem
                          item={it}
                          isDragging={snapshot.isDragging}
                          dragHandleProps={dragProvided.dragHandleProps}
                          onClick={() => handleItemClick(it.id)}
                          onRemove={() => handleRemove(it.id)}
                          onDuplicate={() => handleDuplicate(it.id)}
                          onHoverChange={(hovering) =>
                            setHoverSpotId(
                              hovering && it.placeId ? it.placeId : null
                            )
                          }
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
