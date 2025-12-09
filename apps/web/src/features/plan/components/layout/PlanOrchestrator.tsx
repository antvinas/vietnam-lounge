// apps/web/src/features/plan/components/layout/PlanOrchestrator.tsx

import React, { useMemo, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { usePlanStore } from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

import { usePlanBootstrap } from "@/features/plan/hooks/usePlanBootstrap";
import { PlanShell } from "@/features/plan/components/layout/PlanShell";

import { openPlanPrintFromNormalized } from "@/utils/export/planPdf";
import { t } from "@/features/plan/locales/strings";

const LOCALE = "ko" as const;

function todayISODate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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

  const isPlanSheetOpen = usePlanUIStore((s) => s.isPlanSheetOpen);
  const setPlanSheetOpen = usePlanUIStore((s) => s.setPlanSheetOpen);

  const importSampleTrip = usePlanStore((s) => s.importSampleTrip);
  const setLastSampleTripId = usePlanUIStore((s) => s.setLastSampleTripId);

  const hasExistingTrip = usePlanStore((s) =>
    Object.values(s.trips).some((trip) => !trip.isSample),
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
        .filter((it): it is NonNullable<typeof it> => !!it),
    );

    const links = Object.values(s.links ?? {});

    return { trip, days, items, links };
  });

  const handleExportPdf = () => {
    if (!exportPayload) {
      toast(t(LOCALE, "planPage", "noTripToExport") as string);
      return;
    }
    openPlanPrintFromNormalized(
      exportPayload.trip,
      exportPayload.days,
      exportPayload.items,
      exportPayload.links,
    );
  };

  const currentDayIndex = useMemo(() => {
    if (!currentDayId || !daysOfCurrentTrip.length) return null;
    const idx = daysOfCurrentTrip.findIndex((d) => d.id === currentDayId);
    return idx === -1 ? null : idx;
  }, [currentDayId, daysOfCurrentTrip]);

  const mobileSheetTitle = useMemo(() => {
    if (!hasTrip || currentDayIndex == null) {
      return t(LOCALE, "planPage", "mobileTodayTitle") as string;
    }
    const dayNumber = currentDayIndex + 1;
    return `${dayNumber}일차 일정`;
  }, [hasTrip, currentDayIndex]);

  const createQuickTrip = () => {
    const state = usePlanStore.getState();
    if (typeof state.createTrip !== "function") return;

    const tripId = state.createTrip({
      title: t(LOCALE, "planPage", "quickTripTitle") as string,
      startDateISO: todayISODate(),
      nights: 2,
      currency: "VND",
      budgetTotal: 0,
      transportDefault: "car",
    });

    usePlanStore.setState({ currentTripId: tripId });

    const fresh = usePlanStore.getState();
    const trip = fresh.trips[tripId];
    let firstDayId: string | null = null;
    if (trip && trip.dayIds.length > 0) firstDayId = trip.dayIds[0];
    if (firstDayId) setCurrentDayId(firstDayId);

    navigate("/plan");
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
      if (newTrip && newTrip.dayIds.length > 0) {
        setCurrentDayId(newTrip.dayIds[0]);
      }

      toast.success("추천 일정을 불러왔습니다.");
      navigate("/plan");
    } catch (e) {
      console.error(e);
      toast.error("일정을 불러오는 중 문제가 발생했습니다.");
    }
  };

  const openLastSavedTrip = () => {
    const st = usePlanStore.getState();
    const trips = Object.values(st.trips).filter((t) => !t.isSample);
    if (trips.length === 0) {
      toast(t(LOCALE, "planPage", "noSavedTrip") as string);
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
    let firstDayId: string | null = null;
    if (target.dayIds && target.dayIds.length > 0) firstDayId = target.dayIds[0];
    if (firstDayId) setCurrentDayId(firstDayId);
    navigate("/plan");
  };

  // [기능] 일정 닫기 (메인으로 복귀)
  // useCallback으로 감싸서 useEffect 의존성 관리
  const handleClosePlan = useCallback(() => {
    usePlanStore.setState({ currentTripId: null });
    setCurrentDayId(null);
    navigate("/plan");
  }, [setCurrentDayId, navigate]);

  // [UX 개선] Backspace 및 마우스 뒤로가기 버튼 감지
  useEffect(() => {
    // 트립이 없으면(이미 메인이면) 동작 안 함
    if (!hasTrip) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace") {
        // 입력 필드나 편집 가능한 요소에서는 무시 (글자 지워야 하니까)
        const target = e.target as HTMLElement;
        const isInput =
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable;
        
        if (!isInput) {
          // 입력 중이 아니면 뒤로가기(닫기) 실행
          e.preventDefault(); // 브라우저 뒤로가기 방지하고 우리 로직 실행
          handleClosePlan();
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Mouse Button 3 (Back) or 4 (Forward)
      // 보통 3번이 '뒤로 가기' 버튼
      if (e.button === 3) {
        e.preventDefault(); // 브라우저 기본 동작(페이지 뒤로가기) 막고
        handleClosePlan();  // 우리 닫기 로직 실행
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
              const searchPath = `/plan/search?dayId=${encodeURIComponent(
                String(currentDayId),
              )}`;
              navigate(searchPath, {
                state: {
                  backgroundLocation: location,
                  background: location,
                },
              });
            }}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
          >
            {t(LOCALE, "planPage", "mobileAddPlaceButton")}
          </button>
        </div>
      ),
    [hasTrip, currentDayId, navigate, location],
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
      onChangeDay={setCurrentDayId}
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