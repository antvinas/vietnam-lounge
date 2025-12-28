// src/features/spot/components/reviews/RatingSummary.tsx

import React, { useMemo } from "react";

export type RatingBreakdown = Partial<Record<1 | 2 | 3 | 4 | 5, number>>;

export type RatingSummaryProps = {
  average: number; // 0~5
  total: number; // 총 리뷰 수
  breakdown?: RatingBreakdown; // {5:10,4:3,...}
  onFilterByStar?: (star: 1 | 2 | 3 | 4 | 5) => void;
  className?: string;
};

function Stars({ value }: { value: number }) {
  // 소수점 포함 별 표현
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  const Star = ({ type }: { type: "full" | "half" | "empty" }) => {
    if (type === "half") {
      return (
        <span className="relative inline-block h-5 w-5">
          <svg viewBox="0 0 24 24" className="absolute inset-0 text-emerald-300">
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <path fill="url(#half)" d="M12 17.3l6.2 3.7-1.6-7 5.4-4.7-7.1-.6L12 2 9.1 8.7 2 9.3l5.4 4.7-1.6 7z" />
          </svg>
          <svg viewBox="0 0 24 24" className="absolute inset-0 text-slate-600">
            <path fill="none" stroke="currentColor" d="M12 17.3l6.2 3.7-1.6-7 5.4-4.7-7.1-.6L12 2 9.1 8.7 2 9.3l5.4 4.7-1.6 7z" />
          </svg>
        </span>
      );
    }
    return (
      <svg viewBox="0 0 24 24" className={`h-5 w-5 ${type === "full" ? "text-emerald-300" : "text-slate-600"}`}>
        <path
          fill={type === "full" ? "currentColor" : "none"}
          stroke="currentColor"
          d="M12 17.3l6.2 3.7-1.6-7 5.4-4.7-7.1-.6L12 2 9.1 8.7 2 9.3l5.4 4.7-1.6 7z"
        />
      </svg>
    );
  };
  return (
    <div className="flex items-center gap-1" aria-label={`평점 ${value.toFixed(1)} / 5`}>
      {Array.from({ length: full }).map((_, i) => <Star type="full" key={`f${i}`} />)}
      {half && <Star type="half" />}
      {Array.from({ length: empty }).map((_, i) => <Star type="empty" key={`e${i}`} />)}
    </div>
  );
}

export default function RatingSummary({
  average,
  total,
  breakdown = {},
  onFilterByStar,
  className = "",
}: RatingSummaryProps) {
  const rows = useMemo(() => {
    // 5부터 1까지
    return ([5, 4, 3, 2, 1] as const).map((s) => ({
      star: s,
      count: breakdown[s] ?? 0,
    }));
  }, [breakdown]);

  const maxCount = Math.max(1, ...rows.map((r) => r.count));

  return (
    <section className={`rounded-2xl border border-slate-700 bg-slate-800/40 p-4 ${className}`} aria-label="평점 요약">
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-900/60 px-5 py-4">
          <div className="text-3xl font-extrabold text-slate-50">{average.toFixed(1)}</div>
          <Stars value={average} />
          <div className="mt-1 text-xs text-slate-400">{total.toLocaleString()}개 리뷰</div>
        </div>

        <div className="flex-1 space-y-2">
          {rows.map((r) => {
            const ratio = r.count / maxCount;
            return (
              <button
                key={r.star}
                type="button"
                onClick={() => onFilterByStar?.(r.star)}
                className="group flex w-full items-center gap-3"
                aria-label={`${r.star}점 필터`}
              >
                <span className="w-8 text-right text-sm text-slate-300">{r.star}★</span>
                <div className="relative h-3 flex-1 rounded-full bg-slate-700/60">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-400/80 group-hover:bg-emerald-300"
                    style={{ width: `${Math.max(6, ratio * 100)}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm text-slate-400">{r.count}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
