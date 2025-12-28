// apps/web/src/features/plan/components/day/TimelineItem.tsx

import React from "react";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";

type PlanItemLike = {
  id: string;
  title: string;
  category?: string;

  // 시간 필드 (둘 다 지원)
  startTime?: string | null;
  endTime?: string | null;
  timeStartMin?: number | null;
  timeEndMin?: number | null;

  stayMinutes?: number | null;
  cost?: number | null;

  placeId?: string | null;
  lat?: number | null;
  lng?: number | null;

  note?: string;

  // 레거시/호환 (파일들에서 섞여 쓰이는 경우가 있어 안전하게 허용)
  index?: number;
  order?: number;
  hasConflict?: boolean;
};

type TimelineItemProps = {
  item: PlanItemLike;

  /**
   * ✅ DaySidebar/DayTimeline에서 넘기는 index 지원
   * - 기존에는 item.index를 강제했는데, 실제 Item 타입에는 index가 없어서 빌드가 깨짐
   */
  index?: number;

  isDragging?: boolean;
  isSelected?: boolean;

  /**
   * ✅ conflict는 item.hasConflict 형태도 있었고, 상위에서 prop으로 내려주는 형태도 있어서 둘 다 지원
   */
  hasConflict?: boolean;

  dragHandleProps?: DraggableProvidedDragHandleProps | null;

  onClick?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
  onDuplicate?: () => void;
  onHoverChange?: (hover: boolean) => void;
};

function formatTimeFromMin(min?: number | null) {
  if (min == null || Number.isNaN(min)) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function pickTimeLabel(item: PlanItemLike) {
  const start = (item.startTime ?? "").trim();
  const end = (item.endTime ?? "").trim();

  // 1) 문자열 시간이 있으면 우선 사용
  if (start || end) return `${start || "—"} ~ ${end || "—"}`;

  // 2) 분 단위 시간이 있으면 변환해서 사용
  const s2 = formatTimeFromMin(item.timeStartMin);
  const e2 = formatTimeFromMin(item.timeEndMin);
  if (s2 || e2) return `${s2 || "—"} ~ ${e2 || "—"}`;

  return "시간 미정";
}

export default function TimelineItem({
  item,
  index,
  isDragging,
  isSelected,
  hasConflict,
  dragHandleProps,
  onClick,
  onEdit,
  onRemove,
  onDuplicate,
  onHoverChange,
}: TimelineItemProps) {
  const timeLabel = pickTimeLabel(item);

  const stayLabel =
    item.stayMinutes != null && item.stayMinutes > 0 ? ` · ${item.stayMinutes}분` : "";

  const costLabel =
    item.cost != null && item.cost > 0 ? ` · ${Number(item.cost).toLocaleString("ko-KR")} ₫` : "";

  const conflict = Boolean(hasConflict ?? (item as any).hasConflict);
  const conflictLabel = conflict ? "시간 겹침 주의" : "";

  const displayIndex =
    typeof index === "number"
      ? index
      : typeof (item as any).index === "number"
        ? (item as any).index
        : typeof (item as any).order === "number"
          ? (item as any).order
          : 0;

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
        "w-full rounded-xl border px-4 py-3 shadow-sm transition",
        "bg-white hover:bg-slate-50",
        "dark:bg-slate-900 dark:hover:bg-slate-800/60 dark:border-slate-700",
        isDragging ? "opacity-90" : "",
        isSelected ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900" : "",
        conflict ? "border-rose-300 dark:border-rose-500/60" : "border-slate-200",
      ].join(" ")}
    >
      <div className="grid grid-cols-[auto,1fr,auto] items-start gap-3">
        {/* Drag handle */}
        <div
          {...(dragHandleProps ?? {})}
          className="flex h-full cursor-grab flex-col justify-center pt-1 text-slate-400 hover:text-slate-600 active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-lg leading-none">⋮⋮</span>
        </div>

        {/* Main */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {displayIndex + 1}
            </span>

            <p className="min-w-0 flex-1 truncate text-base font-semibold text-slate-900 dark:text-slate-100">
              {item.title}
            </p>

            {item.category ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {item.category}
              </span>
            ) : null}
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            {timeLabel}
            {stayLabel}
            {costLabel}
          </p>

          {conflictLabel ? (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{conflictLabel}</p>
          ) : null}

          {item.note ? (
            <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.note}</p>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex flex-none items-center gap-2">
          <button
            type="button"
            className="text-xs font-medium text-slate-400 hover:text-slate-600 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
          >
            수정
          </button>

          <button
            type="button"
            className="text-xs font-medium text-slate-400 hover:text-slate-600 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate?.();
            }}
          >
            복제
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
