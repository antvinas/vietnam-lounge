// apps/web/src/features/plan/components/day/DayTimeline.tsx

import { useMemo } from "react";
import { usePlanStore } from "@/store/plan.store";

export default function DayTimeline() {
  const activeDayId = usePlanStore((s: any) => s.activeDayId);

  const days = usePlanStore((s: any) => s.days ?? {});
  const itemsMap = usePlanStore((s: any) => s.items ?? {});

  const day = activeDayId ? days[activeDayId] : null;

  const items = useMemo(() => {
    const itemIds: string[] = (day?.itemIds ?? []) as any;
    return itemIds.map((id: string) => itemsMap[id]).filter(Boolean);
  }, [day, itemsMap]);

  return (
    <section className="flex-1 p-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Timeline</h2>

      <div className="mt-4 space-y-3">
        {items.map((it: any, index: number) => (
          <div
            key={it?.id ?? index}
            className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-950"
          >
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {index + 1}. {it?.title ?? it?.name ?? "Untitled"}
            </div>
            {(it?.timeStartMin != null || it?.timeEndMin != null) && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {it?.timeStartMin ?? "--"} ~ {it?.timeEndMin ?? "--"}
              </div>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            선택된 Day에 아이템이 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}
