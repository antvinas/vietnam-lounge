// apps/web/src/features/plan/components/day/TimelineItem.tsx

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
    lat?: number | null;
    lng?: number | null;
    note?: string;
    hasConflict?: boolean;
  };
  isDragging?: boolean;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  onClick?: () => void;   
  onEdit?: () => void;    
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
  onEdit,
  onRemove,
  onDuplicate,
  onHoverChange,
}: TimelineItemProps) {
  const start = formatTime(item.timeStartMin);
  const end = formatTime(item.timeEndMin);

  const hasTime = !!start || !!end;
  const timeLabel = hasTime
    ? `${start || "—"} ~ ${end || "—"}`
    : "시간 미정";

  const stayLabel =
    item.stayMinutes && item.stayMinutes > 0
      ? ` · ${item.stayMinutes}분`
      : "";

  const costLabel =
    item.cost && item.cost > 0
      ? ` · ${item.cost.toLocaleString("ko-KR")} ₫`
      : "";

  const conflictLabel = item.hasConflict ? "시간 겹침 주의" : "";

  const handleRootClick: React.MouseEventHandler<HTMLDivElement> = () => {
    onClick?.();
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRootClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className={[
        "w-full rounded-xl border bg-white px-3 py-3 text-left shadow-sm transition",
        "border-slate-200 hover:border-emerald-400 hover:shadow-md",
        "dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-emerald-400",
        isDragging
          ? "ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-50 dark:ring-offset-slate-900"
          : "",
      ].join(" ")}
    >
      <div className="grid grid-cols-[auto,1fr,auto] items-start gap-3">
        {/* Drag handle: 크기 확대 */}
        <div
          {...(dragHandleProps ?? {})}
          className="flex h-full cursor-grab flex-col justify-center pt-1 text-slate-400 hover:text-slate-600 active:cursor-grabbing"
        >
          <span className="text-xl leading-none">⋮⋮</span>
        </div>

        {/* 번호 + 내용 */}
        <div className="flex min-w-0 items-start gap-3">
          {/* 번호 뱃지: w-6 h-6로 확대 */}
          <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {item.index + 1}
          </span>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              {/* [폰트 확대] 제목 text-base (16px) + bold */}
              <p className="min-w-0 flex-1 truncate text-base font-bold text-slate-900 dark:text-slate-50">
                {item.title || "제목 없는 일정"}
              </p>
              {item.category && (
                <span className="inline-flex shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  {item.category}
                </span>
              )}
            </div>

            {/* [폰트 확대] 메타 정보 text-sm (14px) */}
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">{timeLabel}</span>
              {stayLabel}
              {costLabel}
            </p>

            {conflictLabel && (
              <p className="text-xs font-medium text-amber-600">⚠️ {conflictLabel}</p>
            )}

            {item.note && (
              <p className="line-clamp-1 text-sm text-slate-500 dark:text-slate-400">
                📝 {item.note}
              </p>
            )}
          </div>
        </div>

        {/* 오른쪽 액션 */}
        <div className="flex flex-col items-end gap-2 pt-0.5">
          <button
            type="button"
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline dark:text-emerald-400"
            onClick={(e) => {
              e.stopPropagation();
              (onEdit ?? onClick)?.();
            }}
          >
            편집
          </button>
          <button
            type="button"
            className="text-xs font-medium text-slate-400 hover:text-rose-500 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}