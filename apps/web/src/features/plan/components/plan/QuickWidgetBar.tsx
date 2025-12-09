// apps/web/src/components/plan/QuickWidgetBar.tsx
import React from "react";

type Props = {
  onOpenBudget?: () => void;
  onOpenNotes?: () => void;
  onToggleFilters?: () => void;
  onShare?: () => void;
  onMapFullscreen?: () => void;
  onOptimizeRoute?: () => void;
  className?: string;
};

export default function QuickWidgetBar({
  onOpenBudget,
  onOpenNotes,
  onToggleFilters,
  onShare,
  onMapFullscreen,
  onOptimizeRoute,
  className,
}: Props) {
  return (
    <div
      role="toolbar"
      aria-label="Planner quick actions"
      className={
        className ??
        "sticky top-0 z-20 flex gap-2 border-b border-gray-100 bg-white/80 p-2 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80"
      }
    >
      <ToolBtn label="예산" onClick={onOpenBudget} />
      <ToolBtn label="메모" onClick={onOpenNotes} />
      <ToolBtn label="필터" onClick={onToggleFilters} />
      <ToolBtn label="공유" onClick={onShare} />
      <ToolBtn label="지도 전체화면" onClick={onMapFullscreen} />
      <ToolBtn label="경로 최적화" onClick={onOptimizeRoute} />
    </div>
  );
}

function ToolBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:hover:bg-gray-800"
    >
      {label}
    </button>
  );
}
