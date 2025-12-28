// src/features/plan/components/Wizard/AdvancedOptions.tsx

import { useId, useState, useEffect } from "react";

export type AdvancedValue = {
  timezone?: string;
  coord?: { lat?: number; lng?: number };
};

type Props = {
  value?: AdvancedValue;
  onChange?: (v: AdvancedValue) => void;
};

const DEFAULTS: AdvancedValue = {
  timezone: "Asia/Ho_Chi_Minh",
  coord: { lat: undefined, lng: undefined },
};

export default function AdvancedOptions({ value, onChange }: Props) {
  const [state, setState] = useState<AdvancedValue>({ ...DEFAULTS, ...value });
  useEffect(() => setState((s) => ({ ...s, ...value })), [value]);

  const id = useId();
  const update = (patch: Partial<AdvancedValue>) => {
    const next = { ...state, ...patch };
    setState(next);
    onChange?.(next);
  };

  return (
    <details className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <summary className="cursor-pointer text-sm font-semibold">고급 설정</summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="form-label">타임존</span>
          <input
            id={`${id}-tz`}
            type="text"
            className="form-input"
            placeholder="예: Asia/Seoul"
            value={state.timezone ?? ""}
            onChange={(e) => update({ timezone: e.target.value })}
          />
          <span className="form-help">미입력 시 Asia/Ho_Chi_Minh</span>
        </label>

        <div className="grid gap-1">
          <span className="form-label">좌표(선택)</span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="any"
              inputMode="decimal"
              className="form-input"
              placeholder="위도"
              value={state.coord?.lat ?? ""}
              onChange={(e) =>
                update({ coord: { ...(state.coord ?? {}), lat: Number(e.target.value) } })
              }
            />
            <input
              type="number"
              step="any"
              inputMode="decimal"
              className="form-input"
              placeholder="경도"
              value={state.coord?.lng ?? ""}
              onChange={(e) =>
                update({ coord: { ...(state.coord ?? {}), lng: Number(e.target.value) } })
              }
            />
          </div>
          <span className="form-help">지정하지 않으면 지도에서 자동 추정</span>
        </div>
      </div>
    </details>
  );
}
