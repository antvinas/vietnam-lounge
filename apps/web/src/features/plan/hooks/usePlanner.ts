// src/hooks/usePlanner.ts
// autosave 디바운스(1.5s) + 공통 CTA 액션 (장소 추가)

import { useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { getPlanById, updatePlan, type Plan } from "@/api/plan.api";
import { usePlanStore } from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

type Opts = { enableAutosave?: boolean; autosaveMs?: number };

export default function usePlanner(planId?: string, opts: Opts = {}) {
  const { enableAutosave = true, autosaveMs = 1500 } = opts;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 버전에서는 스토어 동기화 로직은 최소화
  const title = usePlanStore((s: any) => s.title ?? "");
  const currencyCode = usePlanStore((s: any) => s.currency ?? "VND");
  const blocks = usePlanStore((s: any) => s._legacyBlocks ?? []); // TODO: 정규화 아이템 → API 스케줄 변환기로 교체 예정

  const currentDayId = usePlanUIStore((s) => s.currentDayId);

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
      if (planId) {
        qc.invalidateQueries({ queryKey: ["plan", planId] });
      }
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: { type: "success", text: "저장됨" },
        }),
      );
    },
    onError: (e: any) => {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            type: "error",
            text: `저장 실패: ${e?.message || "unknown"}`,
          },
        }),
      );
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
    };
  }, [enableAutosave, autosaveMs, planId, save]);

  /**
   * 현재 Day 기준 "장소 추가" 공통 액션
   * - Day 미선택 시: toast 에러
   * - Day 선택 시: /plan/search?dayId=... 로 이동 (+ backgroundLocation 유지)
   */
  const goAddPlaceForCurrentDay = useCallback(() => {
    if (!currentDayId) {
      window.dispatchEvent(
        new CustomEvent("toast", {
          detail: {
            type: "error",
            text: "먼저 일정을 선택한 뒤 장소를 추가해 주세요.",
          },
        }),
      );
      return;
    }

    const params = new URLSearchParams();
    params.set("dayId", currentDayId);

    navigate(
      {
        pathname: "/plan/search",
        search: params.toString(),
      },
      {
        state: {
          backgroundLocation: location,
          background: location,
        },
      },
    );
  }, [currentDayId, location, navigate]);

  return {
    plan,
    isLoading,
    save,
    saving: mUpdate.isPending,
    refresh,
    goAddPlaceForCurrentDay,
  };
}
