// apps/web/src/features/plan/components/layout/PlanOrchestrator.tsx

import React, { useMemo, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { usePlanStore } from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

import { usePlanBootstrap } from "@/features/plan/hooks/usePlanBootstrap";
import { useSyncDayIdFromUrl } from "@/features/plan/hooks/useSyncDayIdFromUrl";
import { PlanShell } from "@/features/plan/components/layout/PlanShell";

import { openPlanPrintFromNormalized } from "@/utils/export/planPdf";
import { t } from "@/features/plan/locales/strings";

const LOCALE = "ko" as const;

// ✅ strings.ts(22번) 수정 전까지 타입 에러를 막기 위한 "느슨한 t"
const tLoose = (locale: any, scope: any, key: any) =>
  t(locale, scope, key) as unknown as string;

function todayISODate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildPlanUrlWithDayId(locationSearch: string, dayId: string) {
  const sp = new URLSearchParams(locationSearch);
  sp.set("dayId", dayId);
  return `/plan?${sp.toString()}`;
}

export function PlanOrchestrator() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    hasTrip,
    currentTripId,
    currentTrip,
    currentDayId,
    daysOfCurrentTrip,
    setCurrentDayId,
  } = usePlanBootstrap();

  // ✅ URL(dayId) <-> UI Store(currentDayId) 동기화 (왼쪽 Items가 비는 문제 해결의 핵심)
  useSyncDayIdFromUrl({
    enabled: hasTrip && !!currentTripId && daysOfCurrentTrip.length > 0,
    currentDayId,
    daysOfCurrentTrip,
    setCurrentDayId,
    forcePlanPathname: true,
  });

  const isPlanSheetOpen = usePlanUIStore((s) => s.isPlanSheetOpen);
  const setPlanSheetOpen = usePlanUIStore((s) => s.setPlanSheetOpen);

  const importSampleTrip = usePlanStore((s) => s.importSampleTrip);
  const setLastSampleTripId = usePlanUIStore((s) => s.setLastSampleTripId);

  const hasExistingTrip = usePlanStore((s) =>
    Object.values(s.trips).some((trip) => !trip.isSample)
  );

  // PDF Export Payload
  const exportPayload = usePlanStore((s) => {
    if (!s.currentTripId) return null;
    const trip = s.trips[s.currentTripId];
    if (!trip) return null;

    const days = trip.dayIds
      .map((id) => s.days[id])
      .filter((d): d is NonNullable<typeof d> => !!d);

    const items = days.flatMap((day) =>
      day.itemIds
        .map((id) => s.items[id])
        .filter((it): it is NonNullable<typeof it> => !!it)
    );

    const links = Object.values(s.links ?? {});
    return { trip, days, items, links };
  });

  const handleExportPdf = () => {
    if (!exportPayload) {
      toast(tLoose(LOCALE, "planPage", "noTripToExport"));
      return;
    }

    // ✅ 혹시 저장된 데이터가 null을 들고 있어도 export 함수가 안전하게 받도록 정규화
    const safeTrip = {
      ...exportPayload.trip,
      budgetTotal: exportPayload.trip.budgetTotal ?? undefined,
    };

    openPlanPrintFromNormalized(
      safeTrip as any,
      exportPayload.days as any,
      exportPayload.items as any,
      exportPayload.links as any
    );
  };

  const currentDayIndex = useMemo(() => {
    if (!currentDayId || !daysOfCurrentTrip.length) return null;
    const idx = daysOfCurrentTrip.findIndex((d) => d.id === currentDayId);
    return idx === -1 ? null : idx;
  }, [currentDayId, daysOfCurrentTrip]);

  const mobileSheetTitle = useMemo(() => {
    if (!hasTrip || currentDayIndex == null) {
      return tLoose(LOCALE, "planPage", "mobileTodayTitle");
    }
    const dayNumber = currentDayIndex + 1;
    return `${dayNumber}일차 일정`;
  }, [hasTrip, currentDayIndex]);

  // ✅ Day 변경 시: store + URL을 함께 변경 (새로고침/공유 안정화)
  const handleChangeDay = useCallback(
    (dayId: string | null) => {
      setCurrentDayId(dayId);

      if (!dayId) {
        // dayId를 비우는 케이스는 거의 없지만 안전 처리
        const sp = new URLSearchParams(location.search);
        sp.delete("dayId");
        navigate({ pathname: "/plan", search: `?${sp.toString()}` }, { replace: true });
        return;
      }

      navigate(buildPlanUrlWithDayId(location.search, dayId), { replace: true });
    },
    [setCurrentDayId, navigate, location.search]
  );

  const createQuickTrip = () => {
    const state = usePlanStore.getState();
    if (typeof state.createTrip !== "function") return;

    const tripId = state.createTrip({
      title: tLoose(LOCALE, "planPage", "quickTripTitle"),
      startDateISO: todayISODate(),
      nights: 2,
      currency: "VND",
      budgetTotal: 0,
      transportDefault: "car",
    } as any);

    usePlanStore.setState({ currentTripId: tripId });

    const fresh = usePlanStore.getState();
    const trip = fresh.trips[tripId];

    const firstDayId = trip?.dayIds?.[0] ?? null;
    if (firstDayId) {
      setCurrentDayId(firstDayId);
      navigate(buildPlanUrlWithDayId(location.search, firstDayId), { replace: true });
      return;
    }

    navigate("/plan", { replace: true });
  };

  const openSampleChooser = () => {
    navigate("/plan/sample", {
      state: { backgroundLocation: location, background: location },
    });
  };

  const handleImportSample = async (templateId: string) => {
    try {
      const id = await importSampleTrip({
        templateId: templateId as any,
        isSample: true,
      });
      setLastSampleTripId(id);

      const st = usePlanStore.getState();
      const newTrip = st.trips[id];
      const firstDayId = newTrip?.dayIds?.[0] ?? null;

      if (firstDayId) {
        setCurrentDayId(firstDayId);
        toast.success("추천 일정을 불러왔습니다.");
        navigate(buildPlanUrlWithDayId(location.search, firstDayId), { replace: true });
        return;
      }

      toast.success("추천 일정을 불러왔습니다.");
      navigate("/plan", { replace: true });
    } catch (e) {
      console.error(e);
      toast.error("일정을 불러오는 중 문제가 발생했습니다.");
    }
  };

  const openLastSavedTrip = () => {
    const st = usePlanStore.getState();
    const trips = Object.values(st.trips).filter((t) => !t.isSample);
    if (trips.length === 0) {
      toast(tLoose(LOCALE, "planPage", "noSavedTrip"));
      return;
    }

    const sorted = [...trips].sort((a: any, b: any) => {
      const ta = (a as any).updatedAt || (a as any).createdAt;
      const tb = (b as any).updatedAt || (b as any).createdAt;
      if (!ta && !tb) return 0;
      if (!ta) return 1;
      if (!tb) return -1;
      if (ta === tb) return 0;
      return ta < tb ? 1 : -1;
    });

    const target = sorted[0];
    usePlanStore.setState({ currentTripId: target.id });

    const firstDayId = target?.dayIds?.[0] ?? null;
    if (firstDayId) {
      setCurrentDayId(firstDayId);
      navigate(buildPlanUrlWithDayId(location.search, firstDayId), { replace: true });
      return;
    }

    navigate("/plan", { replace: true });
  };

  const handleClosePlan = useCallback(() => {
    usePlanStore.setState({ currentTripId: null });
    setCurrentDayId(null);
    navigate("/plan", { replace: true });
  }, [setCurrentDayId, navigate]);

  useEffect(() => {
    if (!hasTrip) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace") {
        const target = e.target as HTMLElement;
        const isInput =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          (target as any).isContentEditable;

        if (!isInput) {
          e.preventDefault();
          handleClosePlan();
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 3) {
        e.preventDefault();
        handleClosePlan();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [hasTrip, handleClosePlan]);

  const mobileFooter = useMemo(
    () =>
      !hasTrip ? null : (
        <div className="flex justify-end border-t bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => {
              if (!currentDayId) {
                toast("먼저 일정을 선택한 뒤 장소를 추가해 주세요.");
                return;
              }
              const searchPath = `/plan/search?dayId=${encodeURIComponent(String(currentDayId))}`;
              navigate(searchPath, {
                state: {
                  backgroundLocation: location,
                  background: location,
                },
              });
            }}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
          >
            {tLoose(LOCALE, "planPage", "mobileAddPlaceButton")}
          </button>
        </div>
      ),
    [hasTrip, currentDayId, navigate, location]
  );

  return (
    <PlanShell
      locale={LOCALE}
      hasTrip={hasTrip}
      hasExistingTrip={hasExistingTrip}
      currentTrip={currentTrip}
      currentDayId={currentDayId}
      daysOfCurrentTrip={daysOfCurrentTrip}
      isPlanSheetOpen={isPlanSheetOpen}
      mobileSheetTitle={mobileSheetTitle}
      mobileFooter={mobileFooter}
      onChangeDay={handleChangeDay}
      onTogglePlanSheet={setPlanSheetOpen}
      onExportPdf={handleExportPdf}
      onCreateQuickTrip={createQuickTrip}
      onOpenSampleChooser={openSampleChooser}
      onImportSample={handleImportSample}
      onOpenLastSavedTrip={openLastSavedTrip}
      onClosePlan={handleClosePlan}
    />
  );
}
