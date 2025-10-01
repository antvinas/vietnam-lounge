import { overlap } from "@/lib/date";
import type { PlanItem } from "@/types/plan";
import { usePlanStore } from "@/store/usePlanStore";

interface Props {
  item: PlanItem;
  index: number;
  onDragStart: (i: number) => void;
  onDrop: (i: number) => void;
}

export default function PlanItemCard({ item, index, onDragStart, onDrop }: Props) {
  const { blocks } = usePlanStore();

  // 간단한 브레이크 타임 충돌 예: 15:00 ~ 17:00
  const breakConflict = overlap(item.startTime, item.endTime, "15:00", "17:00");
  const badge = breakConflict
    ? "휴식시간 충돌"
    : item.flags?.happyHour
    ? "해피아워"
    : item.flags?.rainRisk
    ? "우천주의"
    : undefined;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onDrop(index)}
      className="group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-start gap-3">
        {/* 썸네일 자리 */}
        <div className="w-28 h-16 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
          16:9
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-slate-900 dark:text-slate-50 font-semibold">{item.title}</h4>
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                {badge}
              </span>
            )}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-300 mt-1">
            {item.startTime}–{item.endTime} · {item.category ?? "일정"}
          </div>
        </div>

        {/* 순서 표시 */}
        <div className="text-xs text-slate-400">#{index + 1}</div>
      </div>
    </div>
  );
}
