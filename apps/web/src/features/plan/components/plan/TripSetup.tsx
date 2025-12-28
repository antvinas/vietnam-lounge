// src/features/plan/components/plan/TripSetup.tsx
// 초기 여행 기간 프리셋. 정규화 스토어의 createTrip/addDay 사용.

import { useMemo, useState, useEffect } from "react";
import {
  usePlanStore,
  selectCurrentTrip,
  selectDaysOfTrip,
} from "@/features/plan/stores/plan.store";

/**
 * Date -> "YYYY-MM-DD" 포맷으로 변환
 * (스토어에서 사용하는 dateOnly 포맷과 일관되게 사용)
 */
function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function TripSetup() {
  const trip = usePlanStore(selectCurrentTrip);
  const tripId = trip?.id;

  const days = usePlanStore((s) =>
    tripId ? selectDaysOfTrip(s, tripId) ?? [] : []
  );

  // Day가 이미 있으면 이 컴포넌트는 아예 렌더하지 않음 (기존 동작 유지)
  const hiddenByDays = useMemo(() => days.length > 0, [days.length]);

  // 모달 내부에서 한 번 닫으면 다시 안 보이게 하기 위한 로컬 상태
  const [closedOnce, setClosedOnce] = useState(false);

  // trip/day 상태가 바뀌면, 다시 "처음 상태"로 리셋
  useEffect(() => {
    if (hiddenByDays) {
      setClosedOnce(false);
    }
  }, [hiddenByDays]);

  if (hiddenByDays || closedOnce) return null;

  const presets = [1, 2, 3, 4]; // n박 (n+1일)

  const createTrip = usePlanStore((s) => s.createTrip);
  const addDay = usePlanStore((s) => s.addDay);

  function applyPreset(nights: number) {
    const base = new Date();

    // Trip 없으면 생성
    let id = tripId;
    if (!id && createTrip) {
      id = createTrip({
        title: "새 여행",
        startDateISO: formatDateISO(base),
        nights,
      } as any);
    }
    if (!id || !addDay) return;

    // Day 생성: n박 → n+1일
    for (let i = 0; i < nights + 1; i++) {
      const date = new Date(base.getTime() + i * 86400000);
      const dateISO = formatDateISO(date);

      // ✅ 스토어 시그니처가 string 받는 형태로 맞춤
      (addDay as any)(id, dateISO);
    }

    setClosedOnce(true);
  }

  function handleClose() {
    setClosedOnce(true);
  }

  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-[190] w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 px-6 py-5 text-slate-100 shadow-xl">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">여행 기간 선택</h2>
            <p className="mt-1 text-xs text-slate-300">
              처음 여행을 만들 때 몇 박 몇 일로 할지 한 번에 설정할 수 있어요.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            닫기
          </button>
        </header>

        <div className="space-y-3 text-sm">
          <p className="text-xs text-slate-300">
            아래 프리셋 중 하나를 고르면 오늘을 기준으로 날짜가 자동으로 채워집니다.
            나중에 일정에서 날짜는 자유롭게 수정할 수 있어요.
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {presets.map((n) => (
              <button
                key={n}
                type="button"
                className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-3 text-sm font-medium hover:border-emerald-400 hover:bg-slate-700/80"
                onClick={() => applyPreset(n)}
              >
                {n}박 {n + 1}일 만들기
              </button>
            ))}
          </div>
        </div>

        <footer className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="text-[11px] text-slate-400 hover:text-slate-200"
          >
            나중에 설정할게요
          </button>
        </footer>
      </div>
    </div>
  );
}
