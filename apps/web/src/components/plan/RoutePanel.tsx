import React from "react";

type UiTravelMode = "DRIVING" | "TRANSIT" | "BICYCLING" | "WALKING";
type TrafficModel = "best_guess" | "pessimistic" | "optimistic";

type Props = {
  mode: UiTravelMode;
  onModeChange: (m: UiTravelMode) => void;
  optimizeWaypoints: boolean;
  onOptimizeChange: (v: boolean) => void;
  departureTime: Date | null;
  onDepartureTimeChange: (d: Date | null) => void;
  trafficModel: TrafficModel;
  onTrafficModelChange: (m: TrafficModel) => void;
  onRequestRoute: () => void; // 프리뷰 요청
};

const btn = "rounded-xl border px-3 py-1.5 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800";

export default function RoutePanel({
  mode,
  onModeChange,
  optimizeWaypoints,
  onOptimizeChange,
  departureTime,
  onDepartureTimeChange,
  trafficModel,
  onTrafficModelChange,
  onRequestRoute,
}: Props) {
  const ModeBtn = ({ m, label }: { m: UiTravelMode; label: string }) => (
    <button
      type="button"
      onClick={() => onModeChange(m)}
      className={`${btn} ${mode === m ? "border-emerald-500 text-emerald-600" : "border-slate-300"}`}
      aria-pressed={mode === m}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-white/90 px-3 py-2 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
      <div className="flex items-center gap-2">
        <ModeBtn m="DRIVING" label="자동차" />
        <ModeBtn m="TRANSIT" label="대중교통" />
        <ModeBtn m="BICYCLING" label="자전거" />
        <ModeBtn m="WALKING" label="도보" />
      </div>

      <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={optimizeWaypoints}
          onChange={(e) => onOptimizeChange(e.target.checked)}
        />
        경유지 최적화(프리뷰)
      </label>

      <div className="flex items-center gap-2 text-sm">
        <input
          type="datetime-local"
          value={departureTime ? new Date(departureTime).toISOString().slice(0, 16) : ""}
          onChange={(e) => onDepartureTimeChange(e.target.value ? new Date(e.target.value) : null)}
          aria-label="출발 시각"
        />
        <select
          value={trafficModel}
          onChange={(e) => onTrafficModelChange(e.target.value as TrafficModel)}
          disabled={mode !== "DRIVING"}
          aria-label="교통 모델"
        >
          <option value="best_guess">best_guess</option>
          <option value="pessimistic">pessimistic</option>
          <option value="optimistic">optimistic</option>
        </select>

        <button
          type="button"
          className="ml-2 rounded-xl border border-emerald-500 px-3 py-1.5 text-sm text-emerald-600"
          onClick={onRequestRoute}
        >
          경로 보기
        </button>
      </div>
    </div>
  );
}
