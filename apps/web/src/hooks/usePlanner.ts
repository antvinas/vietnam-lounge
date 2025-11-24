// src/hooks/usePlanner.ts
// autosave 디바운스(1.5s). 정규화 스토어로 이관: import 경로만 교체(추가 매핑은 다음 단계에서 API 스키마 확정 후 반영).
import { useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlanById, updatePlan, type Plan } from "@/api/plan.api";
import { usePlanStore } from "@/store/plan.store";

type Opts = { enableAutosave?: boolean; autosaveMs?: number };

export default function usePlanner(planId?: string, opts: Opts = {}) {
  const { enableAutosave = true, autosaveMs = 1500 } = opts;
  const qc = useQueryClient();

  // 현재 버전에서는 스토어 동기화 로직은 최소화
  const title = usePlanStore((s: any) => s.title ?? "");
  const currencyCode = usePlanStore((s: any) => s.currency ?? "VND");
  const blocks = usePlanStore((s: any) => s._legacyBlocks ?? []); // TODO: 정규화 아이템 → API 스케줄 변환기로 교체 예정

  const { data: plan, isLoading, refetch } = useQuery<Plan | null>({
    queryKey: ["plan", planId],
    queryFn: () => (planId ? getPlanById(planId) : Promise.resolve(null)),
    enabled: !!planId,
  });

  useEffect(() => {
    // TODO: plan → 정규화 스토어 주입(createTrip, addDay, addItem) 매핑은 API 스키마 확정 후 반영
  }, [plan]);

  const mUpdate = useMutation({
    mutationFn: async () => {
      if (!planId) return;
      // TODO: 정규화 스토어의 Trip/Day/Item을 API 스케줄로 직렬화
      await updatePlan({
        planId,
        title,
        schedule: blocks, // 임시(레거시 호환). 후속 단계에서 교체
        budget: { currency: currencyCode || "VND" },
      } as any);
    },
    onSuccess: () => {
      if (planId) qc.invalidateQueries({ queryKey: ["plan", planId] });
      window.dispatchEvent(new CustomEvent("toast", { detail: { type: "success", text: "저장됨" } }));
    },
    onError: (e: any) => {
      window.dispatchEvent(new CustomEvent("toast", { detail: { type: "error", text: `저장 실패: ${e?.message || "unknown"}` } }));
    },
  });

  const save = useCallback(() => mUpdate.mutate(), [mUpdate]);
  const refresh = useCallback(() => refetch(), [refetch]);

  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!enableAutosave || !planId) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => save(), autosaveMs);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [enableAutosave, autosaveMs, planId, blocks, title, currencyCode, save]);

  return { plan, isLoading, save, saving: mUpdate.isPending, refresh };
}
