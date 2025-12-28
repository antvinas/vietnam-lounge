// apps/web/src/features/plan/components/day/DayTabs.tsx

import React, { useEffect } from "react";
import { parseISO, format } from "date-fns";

import {
  usePlanStore,
  selectCurrentTrip,
  selectDaysOfTrip,
} from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

/**
 * 상단 Day 탭 바
 *
 * - 현재 Trip 의 Day 들을 순서대로 탭으로 표시
 * - 클릭 시 URL 은 건드리지 않고, UI store 의 currentDayId 만 변경
 * - usePlanBootstrap 이 URL ?dayId 와 currentDayId 를 정규화해 준다.
 */
const DayTabs: React.FC = () => {
  const { trip, days } = usePlanStore((state) => {
    const trip = selectCurrentTrip(state);
    const days = trip ? selectDaysOfTrip(state, trip.id) : [];
    return { trip, days };
  });

  const currentDayId = usePlanUIStore((s) => s.currentDayId);
  const setCurrentDayId = usePlanUIStore((s) => s.setCurrentDayId);

  // Trip / Days 가 로드되었는데 currentDayId 가 아직 없으면 첫번째 Day 로 세팅
  useEffect(() => {
    if (!trip) return;
    if (!days.length) return;

    if (!currentDayId) {
      setCurrentDayId(days[0].id);
    }
  }, [trip, days, currentDayId, setCurrentDayId]);

  if (!trip || !days.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {days.map((day, index) => {
        const isActive = day.id === currentDayId;

        let label = `${index + 1}일차`;
        try {
          if (day.dateISO) {
            const d = parseISO(day.dateISO);
            const formatted = format(d, "M/d(EEE)");
            label = `${index + 1}일차 · ${formatted}`;
          }
        } catch {
          // date 파싱 실패시 기본 라벨만 사용
        }

        return (
          <button
            key={day.id}
            type="button"
            onClick={() => setCurrentDayId(day.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              isActive
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-gray-100 text-gray-700 border-transparent dark:bg-gray-800 dark:text-gray-200"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default DayTabs;
