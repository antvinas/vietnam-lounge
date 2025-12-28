// apps/web/src/features/plan/pages/PlanShareView.tsx

import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { usePlanStore } from "@/store/plan.store";

type Day = {
  id: string;
  tripId: string;
  dateISO: string;
  title?: string;
};

type Item = {
  id: string;
  tripId: string;
  dayId: string;
  title?: string;
  timeStartMin?: number;
  timeEndMin?: number;
};

export default function PlanShareView() {
  const { shareId } = useParams();

  const days = usePlanStore((s) => {
    if (!shareId) return [] as Day[];
    const arr = Object.values((s as any).days ?? {}) as Day[];
    return arr.filter((d) => d.tripId === shareId);
  });

  const items = usePlanStore((s) => {
    if (!shareId) return [] as Item[];
    const arr = Object.values((s as any).items ?? {}) as Item[];
    return arr.filter((it) => it.tripId === shareId);
  });

  const itemsByDay = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const it of items) {
      const list = m.get(it.dayId) ?? [];
      list.push(it);
      m.set(it.dayId, list);
    }
    return m;
  }, [items]);

  if (!shareId) {
    return <div className="p-6">잘못된 접근입니다.</div>;
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-bold mb-4">공유된 일정</h1>

      <div className="space-y-4">
        {days.map((d) => {
          const list = itemsByDay.get(d.id) ?? [];
          return (
            <div key={d.id} className="rounded-xl border p-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{d.title ?? d.dateISO}</div>
                <div className="text-sm text-gray-500">{d.dateISO}</div>
              </div>

              <div className="mt-3 space-y-2">
                {list.length === 0 ? (
                  <div className="text-sm text-gray-500">아이템이 없습니다.</div>
                ) : (
                  list.map((it: Item) => (
                    <div key={it.id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
                      <div className="font-medium">{it.title ?? "Untitled"}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
