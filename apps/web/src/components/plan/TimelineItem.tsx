// apps/web/src/components/plan/TimelineItem.tsx
import React from "react";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

type TimelineItemProps = {
  item: {
    id: string;
    index: number;
    title: string;
    category?: string;
    timeStartMin?: number | null;
    timeEndMin?: number | null;
    stayMinutes?: number | null;
    cost?: number;
    placeId?: string;
    lat?: number;
    lng?: number;
    note?: string;
    hasConflict?: boolean;
  };
  isDragging?: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  onClick?: () => void;
  onRemove?: () => void;
  onDuplicate?: () => void;
  onHoverChange?: (hover: boolean) => void;
};

function formatTime(min?: number | null) {
  if (min == null || Number.isNaN(min)) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export default function TimelineItem({
  item,
  isDragging,
  dragHandleProps,
  onClick,
  onRemove,
  onDuplicate,
  onHoverChange,
}: TimelineItemProps) {
  const start = formatTime(item.timeStartMin);
  const end = formatTime(item.timeEndMin);

  const handleCardClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    // 우측 버튼/액션 영역 클릭 시에는 카드 onClick 방지
    if ((e.target as HTMLElement).closest("[data-timeline-action]")) return;
    onClick?.();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={[
        "w-full rounded-2xl border bg-white px-3 py-2.5 text-left shadow-sm transition",
        "border-slate-200 hover:border-emerald-400 hover:shadow-md",
        "dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-emerald-400",
        isDragging
          ? "ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-50 dark:ring-offset-slate-900"
          : "",
      ].join(" ")}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      <div className="grid grid-cols-[auto,1fr,auto] items-center gap-3">
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className="flex h-full cursor-grab flex-col items-center justify-center text-slate-400 hover:text-slate-600 active:cursor-grabbing"
        >
          <span className="text-lg leading-none">⋮⋮</span>
        </div>

        {/* Main content */}
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 break-words text-sm font-medium leading-snug text-slate-900 dark:text-slate-50">
              {item.title || "제목 없는 일정"}
            </p>
            {item.category && (
              <span className="inline-flex shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                {item.category}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {start && end ? `${start} ~ ${end}` : start || end || "시간 미정"}
            {item.stayMinutes ? ` · 체류 ${item.stayMinutes}분` : null}
            {item.hasConflict && (
              <span className="ml-1 inline-flex items-center text-[11px] font-semibold text-amber-600">
                ⚠ 겹치는 일정
              </span>
            )}
          </p>

          {typeof item.cost === "number" && item.cost > 0 && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
              예상 비용: {item.cost.toLocaleString()} VND
            </p>
          )}

          {item.note && (
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              📝 {item.note}
            </p>
          )}
        </div>

        {/* Actions */}
        <div
          className="flex flex-col items-end gap-1 text-[11px]"
          data-timeline-action
        >
          <button
            type="button"
            className="text-xs text-emerald-600 hover:underline dark:text-emerald-300"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            시간 편집
          </button>
          <button
            type="button"
            className="text-xs text-rose-500 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
          >
            삭제
          </button>
          {onDuplicate && (
            <button
              type="button"
              className="text-[11px] text-slate-500 hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              복제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
