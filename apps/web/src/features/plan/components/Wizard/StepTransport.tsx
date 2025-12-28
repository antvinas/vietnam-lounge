// src/features/plan/components/Wizard/StepTransport.tsx

import type { TransportState } from "@/features/plan/hooks/usePlanWizard";

const LABELS: Record<TransportState["defaultMode"], string> = {
  walk: "도보",
  car: "자동차",
  transit: "대중교통",
  bike: "자전거",
};

export default function StepTransport({
  value,
  onChange,
}: {
  value: TransportState;
  onChange: (v: TransportState) => void;
}) {
  const set = (m: TransportState["defaultMode"]) => onChange({ defaultMode: m });

  const legendId = "transport-legend";

  return (
    <fieldset className="grid gap-3">
      <legend id={legendId} className="form-label">기본 이동수단</legend>

      <div
        role="radiogroup"
        aria-labelledby={legendId}
        className="flex flex-wrap gap-3"
      >
        {(["walk", "car", "transit", "bike"] as const).map((m) => (
          <label key={m} className="inline-flex items-center gap-2 rounded-md border px-3 py-2">
            <input
              type="radio"
              name="transport"
              checked={value.defaultMode === m}
              onChange={() => set(m)}
              aria-labelledby={`${legendId}`}
            />
            <span className="text-sm">{LABELS[m]}</span>
          </label>
        ))}
      </div>

      <p className="form-help">각 구간은 나중에 개별 변경할 수 있습니다.</p>
    </fieldset>
  );
}
