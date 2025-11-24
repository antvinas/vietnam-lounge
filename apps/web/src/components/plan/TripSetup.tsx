// src/components/plan/TripSetup.tsx
// 초기 여행 기간 프리셋. 정규화 스토어의 createTrip/addDay 사용.
import { useMemo } from "react";
import { usePlanStore, selectCurrentTrip, selectDaysOfTrip } from "@/store/plan.store";

export default function TripSetup() {
  const trip = usePlanStore(selectCurrentTrip);
  const tripId = trip?.id;

  const days = usePlanStore((s) => (tripId ? selectDaysOfTrip(s, tripId) ?? [] : []));

  // Day가 이미 있으면 숨김
  const hidden = useMemo(() => days.length > 0, [days.length]);
  if (hidden) return null;

  const presets = [1, 2, 3, 4]; // n박 (n+1일)

  const createTrip = usePlanStore((s) => s.createTrip);
  const addDay = usePlanStore((s) => s.addDay);

  function applyPreset(nights: number) {
    // Trip 없으면 생성
    let id = tripId;
    if (!id && createTrip) {
      id = createTrip({ title: "새 여행", currency: "VND" });
    }
    if (!id || !addDay) return;

    const base = new Date();
    for (let i = 0; i < nights + 1; i++) {
      const dateISO = new Date(base.getTime() + i * 86400000).toISOString().slice(0, 10);
      addDay(id, { dateISO });
    }
  }

  return (
    <div className="mb-4 rounded-lg border bg-slate-800/60 p-4 text-slate-100">
      <div className="mb-2 font-semibold">여행 기간 선택</div>
      <div className="flex gap-2">
        {presets.map((n) => (
          <button
            key={n}
            type="button"
            className="rounded-md border bg-slate-900 px-3 py-1 text-sm hover:bg-slate-700"
            onClick={() => applyPreset(n)}
          >
            {n}박 {n + 1}일 만들기
          </button>
        ))}
      </div>
    </div>
  );
}
