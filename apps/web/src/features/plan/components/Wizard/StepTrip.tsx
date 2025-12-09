// src/features/plan/components/Wizard/StepTrip.tsx

import type { TripState } from "@/features/plan/hooks/usePlanWizard";

function formatDateISO(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function StepTrip({
  value,
  onChange,
}: {
  value: TripState;
  onChange: (v: TripState) => void;
}) {
  const nights = Math.max(1, Number(value.nights || 1));
  const days = nights + 1;

  let endStr = "";
  if (value.startDate) {
    const start = new Date(value.startDate);
    if (!Number.isNaN(start.getTime())) {
      const end = new Date(start);
      end.setDate(start.getDate() + nights);
      endStr = `${formatDateISO(start)} → ${formatDateISO(end)}`;
    }
  }

  return (
    <form className="grid gap-4">
      <label className="grid gap-1">
        <span className="form-label">출발일</span>
        <input
          type="date"
          value={value.startDate ?? ""}
          onChange={(e) => onChange({ ...value, startDate: e.target.value })}
          className="form-input"
          placeholder="예: 2025-02-15"
        />
        <span className="form-help">{endStr ? `${nights}박 ${days}일 · ${endStr}` : `${nights}박 ${days}일`}</span>
      </label>

      <label className="grid gap-1">
        <span className="form-label">숙박 수</span>
        <input
          type="number"
          min={1}
          value={nights}
          onChange={(e) =>
            onChange({ ...value, nights: Math.max(1, Number(e.target.value) || 1) })
          }
          className="form-input"
          placeholder="예: 3"
        />
        <span className="form-help">총 {days}일 일정</span>
      </label>

      {/* 타임존 등은 AdvancedOptions에서 처리 */}
    </form>
  );
}
