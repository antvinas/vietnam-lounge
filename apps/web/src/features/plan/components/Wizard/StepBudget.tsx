// src/features/plan/components/Wizard/StepBudget.tsx

import type { BudgetState, TripState } from "@/features/plan/hooks/usePlanWizard";

export default function StepBudget({
  value,
  onChange,
  trip,
}: {
  value: BudgetState;
  onChange: (v: BudgetState) => void;
  trip?: TripState;
}) {
  const days = (trip?.nights ?? 0) + 1;
  const perDay = days > 0 ? Math.floor((value.total || 0) / days) : 0;

  return (
    <form className="grid gap-4">
      <label className="grid gap-1">
        <span className="text-sm">통화</span>
        <select
          value={value.currency}
          onChange={(e) => onChange({ ...value, currency: e.target.value })}
          className="rounded-md border px-3 py-2"
        >
          <option value="VND">VND</option>
          <option value="KRW">KRW</option>
          <option value="USD">USD</option>
        </select>
      </label>

      <label className="grid gap-1">
        <span className="text-sm">총 예산</span>
        <input
          type="number"
          min={0}
          value={value.total}
          onChange={(e) => onChange({ ...value, total: Math.max(0, Number(e.target.value) || 0) })}
          className="rounded-md border px-3 py-2"
        />
      </label>

      <p className="text-xs text-gray-500">
        일수 {days} 기준 권장 일일 예산: <b>{perDay.toLocaleString()} {value.currency}</b>
      </p>
    </form>
  );
}
