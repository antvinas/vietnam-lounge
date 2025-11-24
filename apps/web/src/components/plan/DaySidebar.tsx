// apps/web/src/components/plan/DaySidebar.tsx
import React, { useMemo } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useLocation, useNavigate } from "react-router-dom";

import TimelineItem from "@/components/plan/TimelineItem";

import {
  usePlanStore,
  selectItemsOfDay,
  selectConflictsOfDay,
} from "@/store/plan.store";
import { usePlanUIStore } from "@/store/plan.ui.store";

type Props = {
  dayId?: string;
};

/**
 * DayTimeline / DaySidebar
 * - 특정 Day의 아이템을 시간순으로 정렬해서 보여주는 타임라인
 * - 드래그로 순서 변경 가능
 * - 상단에 "일정에 장소 추가" 버튼 배치
 */
export default function DaySidebar({ dayId }: Props) {
  const uiCurrentDayId = usePlanUIStore((s) => s.currentDayId);
  const activeDayId = dayId ?? uiCurrentDayId;

  const setSelectedItemId = usePlanUIStore((s) => s.setSelectedItemId);
  const setHoverSpotId = usePlanUIStore((s) => s.setHoverSpotId);
  const selectedItemId = usePlanUIStore((s) => s.selectedItemId);
  const clearSelection = usePlanUIStore((s) => s.clearSelection);

  const { rawItems, removeItem, addItem, moveItemWithinDay } = usePlanStore(
    (s) => ({
      rawItems: selectItemsOfDay(s, activeDayId),
      removeItem: s.removeItem,
      addItem: s.addItem,
      moveItemWithinDay: s.moveItemWithinDay,
    })
  );

  const conflicts = usePlanStore(
    (s) => selectConflictsOfDay(s, activeDayId ?? null) ?? []
  );

  // 🔹 전체 day 맵 (라벨 계산용)
  const daysMap = usePlanStore((s) => (s as any).days);

  const items = useMemo(
    () =>
      rawItems
        .slice()
        .sort((a: any, b: any) => {
          const ta = a.timeStartMin ?? 0;
          const tb = b.timeStartMin ?? 0;
          if (ta === tb) return (a.order ?? 0) - (b.order ?? 0);
          return ta - tb;
        })
        .map((it: any, index: number) => {
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
            cost:
              typeof it.cost === "number"
                ? (it.cost as number)
                : undefined,
            placeId: it.placeId,
            lat: it.lat,
            lng: it.lng,
            note: it.note as string | undefined,
            hasConflict: !!conflict,
          };
        }),
    [rawItems, conflicts]
  );

  // 🔹 헤더에 표시할 "N일차 일정" 라벨 계산
  const dayHeaderLabel = useMemo(() => {
    if (!activeDayId || !daysMap) return "일정";

    const allDays = Object.values(daysMap as any[]);
    const currentDay: any = (daysMap as any)[activeDayId];
    if (!currentDay) return "일정";

    const daysOfTrip = allDays
      .filter((d: any) => d.tripId === currentDay.tripId)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    const idx = daysOfTrip.findIndex((d: any) => d.id === activeDayId);
    if (idx >= 0) {
      // 0-based → 1-based
      return `${idx + 1}일차 일정`;
    }

    return "일정";
  }, [activeDayId, daysMap]);

  // 🔹 빈 상태/설명용 "N일차" 라벨
  const dayBaseLabel = useMemo(() => {
    if (!activeDayId || !daysMap) return "";
    const allDays = Object.values(daysMap as any[]);
    const currentDay: any = (daysMap as any)[activeDayId];
    if (!currentDay) return "";

    const daysOfTrip = allDays
      .filter((d: any) => d.tripId === currentDay.tripId)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    const idx = daysOfTrip.findIndex((d: any) => d.id === activeDayId);
    if (idx >= 0) {
      return `${idx + 1}일차`;
    }
    return "";
  }, [activeDayId, daysMap]);

  const handleItemClick = (id: string) => {
    setSelectedItemId(id);
  };

  const handleRemove = (id: string) => {
    if (!window.confirm("이 일정을 삭제할까요?")) return;
    removeItem(id);

    if (selectedItemId === id) {
      clearSelection();
    }
  };

  const handleDuplicate = (id: string) => {
    const origin = rawItems.find((it: any) => it.id === id);
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

  const navigate = useNavigate();
  const location = useLocation();

  const handleAddPlaceClick = () => {
    if (!activeDayId) {
      window.alert("먼저 Day를 선택한 뒤 장소를 추가해 주세요.");
      return;
    }

    const searchPath = `/plan/search?dayId=${encodeURIComponent(
      String(activeDayId)
    )}`;

    navigate(searchPath, {
      state: {
        backgroundLocation: location,
        background: location,
      },
    });
  };

  if (!activeDayId) {
    return (
      <div className="py-6 text-center text-xs text-slate-400">
        Day를 먼저 선택해 주세요.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2">
      {/* 상단 헤더 + 일정에 장소 추가 버튼 */}
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
          {dayHeaderLabel}
        </span>
        <button
          type="button"
          onClick={handleAddPlaceClick}
          className="rounded-md bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white shadow hover:bg-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:ring-offset-1"
        >
          + 장소 추가
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-3 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <p className="mb-1 text-xs font-semibold text-slate-600 dark:text-slate-200">
            {dayBaseLabel
              ? `${dayBaseLabel}에는 아직 추가된 일정이 없습니다.`
              : "아직 추가된 일정이 없습니다."}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            상단의 <b>+ 장소 추가</b> 버튼으로 일정을 시작해 보세요.
          </p>
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
                  <Draggable
                    key={it.id}
                    draggableId={it.id}
                    index={index}
                  >
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
