// apps/web/src/features/plan/components/plan/DaySchedule.tsx
import React from "react";
import {
  usePlanStore,
  selectItemsOfDay,
} from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

const DaySchedule: React.FC = () => {
  const currentDayId = usePlanUIStore((s) => s.currentDayId);

  const items = usePlanStore((state) =>
    currentDayId ? selectItemsOfDay(state, currentDayId) : []
  );

  if (!currentDayId) {
    return null;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        아직 일정이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900 dark:text-gray-50">
              {item.title || "제목 없는 일정"}
            </span>
            {(item.startTime || item.endTime) && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {item.startTime ?? ""}
                {item.endTime ? ` ~ ${item.endTime}` : ""}
              </span>
            )}
          </div>

          {item.placeId && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              <PlaceName placeId={item.placeId} />
            </p>
          )}

          {item.note && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {item.note}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

const PlaceName: React.FC<{ placeId: string }> = ({ placeId }) => {
  const place = usePlanStore((s) => s.places[placeId]);
  if (!place) return null;
  return <>{place.name}</>;
};

export default DaySchedule;
