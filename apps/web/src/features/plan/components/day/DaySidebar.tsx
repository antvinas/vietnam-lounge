// apps/web/src/features/plan/components/day/DaySidebar.tsx

import React, { useMemo, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useLocation, useNavigate } from "react-router-dom";

import TimelineItem from "@/features/plan/components/day/TimelineItem";
import useIsMobileLG from "@/hooks/useIsMobileLG";

// [추가] 날씨 위젯 import (경로는 프로젝트 구조에 맞춰 조정 필요)
// 만약 components/plan/widgets/WeatherWidget.tsx 에 있다면:
import WeatherWidget from "@/components/widgets/WeatherWidget"; 
// 또는 components/common/WeatherWidget.tsx 라면 그에 맞게 수정

import {
  usePlanStore,
  selectItemsOfDay,
  selectConflictsOfDay,
} from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

function getGapMinutes(prevEnd: number | null | undefined, nextStart: number | null | undefined) {
  if (prevEnd == null || nextStart == null) return 0;
  return nextStart - prevEnd;
}

function GapDisplay({ minutes }: { minutes: number }) {
  if (minutes < 30) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const label = h > 0 ? `${h}시간 ${m > 0 ? `${m}분` : ""} 여유` : `${m}분 여유`;

  return (
    <div className="mx-4 my-3 flex items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 py-2 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
      <span className="mr-2 text-lg">☕</span> 
      {label}
    </div>
  );
}

type Props = {
  dayId: string | null;
};

export default function DaySidebar({ dayId }: Props) {
  const activeDayId = dayId;
  const isMobile = useIsMobileLG();

  const {
    setSelectedItemId,
    setHoverSpotId,
    selectedItemId,
    setEditingItemId,
    centerOnLatLng,
    openItemDetail,
    closeItemDetail,
    isMobileEditMode, 
    toggleMobileEditMode, 
  } = usePlanUIStore((s: any) => ({
    setSelectedItemId: s.setSelectedItemId,
    setHoverSpotId: s.setHoverSpotId,
    selectedItemId: s.selectedItemId,
    setEditingItemId: s.setEditingItemId,
    centerOnLatLng: s.centerOnLatLng,
    openItemDetail: s.openItemDetail,
    closeItemDetail: s.closeItemDetail,
    isMobileEditMode: s.isMobileEditMode,
    toggleMobileEditMode: s.toggleMobileEditMode,
  }));

  const { rawItems, places, removeItem, addItem, moveItemWithinDay } =
    usePlanStore((s) => ({
      rawItems: activeDayId ? selectItemsOfDay(s, activeDayId) : [],
      places: (s as any).places ?? {},
      removeItem: s.removeItem,
      addItem: s.addItem,
      moveItemWithinDay: s.moveItemWithinDay,
    }));

  const rawConflicts = usePlanStore((s) =>
    activeDayId ? selectConflictsOfDay(s, activeDayId) : [],
  );

  const conflictIdSet = useMemo(() => {
    const set = new Set<string>();
    for (const pair of rawConflicts as any[]) {
      if (pair?.a?.id) set.add(pair.a.id);
      if (pair?.b?.id) set.add(pair.b.id);
    }
    return set;
  }, [rawConflicts]);

  const daysMap = usePlanStore((s) => (s as any).days);

  const items = useMemo<any[]>(
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
          const placeId = it.placeId as string | undefined;
          const place = placeId ? (places as any)[placeId] : undefined;
          
          const fromPlace = place && typeof place.lat === "number" && typeof place.lng === "number" ? { lat: place.lat, lng: place.lng } : null;
          const fromItem = typeof it.lat === "number" && typeof it.lng === "number" ? { lat: it.lat, lng: it.lng } : null;
          const gp = (it as any).googlePlace;
          const fromGooglePlace = gp && typeof gp.lat === "number" && typeof gp.lng === "number" ? { lat: gp.lat, lng: gp.lng } : null;
          const pos = fromPlace ?? fromItem ?? fromGooglePlace;

          return {
            id: it.id,
            index,
            title: it.title || "",
            category: it.category,
            timeStartMin: it.timeStartMin,
            timeEndMin: it.timeEndMin,
            stayMinutes: it.stayMinutes,
            cost: typeof it.cost === "number" ? it.cost : undefined,
            placeId: it.placeId,
            note: it.note,
            hasConflict: conflictIdSet.has(it.id),
            lat: pos?.lat ?? null,
            lng: pos?.lng ?? null,
          };
        }),
    [rawItems, conflictIdSet, places],
  );

  // [추가] 날씨 위젯용 좌표 (첫 번째 아이템 기준)
  const firstLocation = useMemo(() => {
    if (items.length > 0) {
      const first = items[0];
      if (first.lat && first.lng) {
        return { lat: first.lat, lng: first.lng };
      }
    }
    return null;
  }, [items]);

  const dayHeaderLabel = useMemo(() => {
    if (!activeDayId || !daysMap) return "일정";
    const allDays = Object.values(daysMap as any[]);
    const currentDay: any = (daysMap as any)[activeDayId];
    if (!currentDay) return "일정";
    const daysOfTrip = allDays
      .filter((d: any) => d.tripId === currentDay.tripId)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    const idx = daysOfTrip.findIndex((d: any) => d.id === activeDayId);
    if (idx >= 0) return `${idx + 1}일차 일정`;
    return "일정";
  }, [activeDayId, daysMap]);

  useEffect(() => {
    if (!selectedItemId) return;
    const el = document.getElementById(`plan-item-${selectedItemId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedItemId]);

  const navigate = useNavigate();
  const location = useLocation();

  const handleAddPlaceClick = () => {
    if (!activeDayId) {
      window.alert("먼저 Day를 선택해 주세요.");
      return;
    }
    const url = `/plan/search?dayId=${encodeURIComponent(activeDayId)}`;
    navigate(url, { state: { backgroundLocation: location, background: location } });
  };

  const isDragEnabled = !isMobile || isMobileEditMode;

  if (!activeDayId) {
    return <div className="py-10 text-center text-sm text-slate-400">Day를 먼저 선택하세요.</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-slate-900">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {dayHeaderLabel}
            </span>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              ({items.length}곳)
            </span>
            
            {isMobile && (
              <button
                onClick={toggleMobileEditMode}
                className={`ml-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  isMobileEditMode
                    ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-700"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
              >
                {isMobileEditMode ? "편집 완료" : "순서 편집"}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddPlaceClick}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600 active:scale-95"
          >
            + 장소 추가
          </button>
        </div>

        {/* [추가] 날씨 위젯 (위치가 있을 때만 표시) */}
        {firstLocation && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">현지 날씨</span>
              {/* WeatherWidget은 내부적으로 데이터를 로딩함 */}
              <WeatherWidget lat={firstLocation.lat} lng={firstLocation.lng} mode="compact" />
            </div>
          </div>
        )}
      </div>

      {/* 리스트 */}
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 rounded-full bg-slate-100 p-5 dark:bg-slate-800">
            <span className="text-3xl">🗺️</span>
          </div>
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
            일정이 비어있어요
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            가고 싶은 맛집, 관광지를 추가해보세요.
          </p>
          <button
            onClick={handleAddPlaceClick}
            className="mt-6 text-sm font-bold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            장소 검색하기 &rarr;
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 pb-20">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={activeDayId} isDropDisabled={!isDragEnabled}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-3">
                  {items.map((it, index) => {
                    const prevItem = index > 0 ? items[index - 1] : null;
                    const gap = getGapMinutes(prevItem?.timeEndMin, it.timeStartMin);

                    return (
                      <React.Fragment key={it.id}>
                        {gap > 0 && <GapDisplay minutes={gap} />}
                        
                        <Draggable draggableId={it.id} index={index} isDragDisabled={!isDragEnabled}>
                          {(drag, snap) => (
                            <div
                              ref={drag.innerRef}
                              {...drag.draggableProps}
                              {...drag.dragHandleProps}
                              id={`plan-item-${it.id}`}
                              style={{
                                ...drag.draggableProps.style,
                                opacity: snap.isDragging ? 0.6 : 1,
                                zIndex: snap.isDragging ? 50 : "auto",
                              }}
                            >
                              <TimelineItem
                                item={it}
                                index={index}
                                isDragging={snap.isDragging}
                                onClick={() => {
                                  setSelectedItemId(it.id);
                                  setEditingItemId(null);
                                  if (typeof it.lat === "number" && typeof it.lng === "number") {
                                    centerOnLatLng(it.lat, it.lng);
                                  }
                                  openItemDetail(it.id);
                                }}
                                onRemove={() => handleRemove(it.id)}
                                onDuplicate={() => handleDuplicate(it.id)}
                                onHoverChange={(hover) => setHoverSpotId(hover ? it.id : null)}
                              />
                            </div>
                          )}
                        </Draggable>
                      </React.Fragment>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
    </div>
  );

  function handleRemove(id: string) {
    if (isMobile && !isMobileEditMode) {
      window.alert("삭제하려면 상단의 '순서 편집' 버튼을 눌러주세요.");
      return;
    }
    if (!window.confirm("이 일정을 정말 삭제하시겠습니까?")) return;
    
    removeItem(id);
    if (selectedItemId === id) {
      setEditingItemId(null);
      closeItemDetail();
    }
  }

  function handleDuplicate(id: string) {
    const origin = rawItems.find((x: any) => x.id === id);
    if (!origin) return;
    const copy = { ...origin, id: undefined, order: (origin.order ?? 0) + 0.1 };
    addItem(copy as any);
  }

  function handleDragEnd(result: DropResult) {
    const { source, destination } = result;
    if (!destination || !activeDayId) return;
    if (source.index === destination.index) return;
    moveItemWithinDay(activeDayId, source.index, destination.index);
  }
}