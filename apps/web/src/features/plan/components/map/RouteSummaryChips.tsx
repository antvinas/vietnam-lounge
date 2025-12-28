// src/components/plan/RouteSummaryChips.tsx
import React from "react";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";
import { useRouteStore } from "@/store/useRouteStore";

/**
 * 경로 요약 칩
 * - 거리/시간 요약(summaries)
 * - 최적화 미리보기 절감 Δ(분) (optimizeDeltaMin)
 * 초기 렌더/빈 스토어에서도 안전하게 동작하도록 널가드 처리.
 */
export default function RouteSummaryChips() {
  // summaries: [] 보장
  const summaries = useRouteStore((s) => s.summaries);
  const deltaMin = usePlanUIStore(
    (s: any) => s.optimizeDeltaMin ?? null
  );

  const hasDelta = typeof deltaMin === "number" && deltaMin > 0;
  const hasSummaries =
    Array.isArray(summaries) && summaries.length > 0;

  if (!hasDelta && !hasSummaries) return null;

  return (
    // 상태 변화 즉시 읽히도록 status 역할 제공
    <div
      className="flex flex-wrap gap-2 p-2"
      role="status"
      aria-live="polite"
    >
      {hasDelta && (
        <div className="px-3 py-1 rounded-full bg-emerald-600/90 text-white text-sm">
          최적화 미리보기: -{deltaMin}분
        </div>
      )}

      {hasSummaries &&
        summaries.map((s: any) => (
          <div
            key={s.id}
            className="px-3 py-1 rounded-full bg-slate-800/80 text-slate-50 text-sm flex items-center gap-2"
          >
            {s.etaText && <span>ETA {s.etaText}</span>}
            {s.distanceText && <span>· {s.distanceText}</span>}
            {typeof s.transfers === "number" && (
              <span>· 환승 {s.transfers}</span>
            )}
            {s.fareText && <span>· {s.fareText}</span>}
          </div>
        ))}
    </div>
  );
}
