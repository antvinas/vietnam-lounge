// apps/web/src/pages/Plan/index.tsx
import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";

import {
  usePlanStore,
  selectCurrentTrip,
  selectDaysOfTrip,
  selectItemsOfDay,
} from "@/store/plan.store";
import { usePlanUIStore } from "@/store/plan.ui.store";

import DaySidebar from "@/components/plan/DaySidebar";
import PlanSummaryBar from "@/components/plan/PlanSummaryBar";
import MapPanel from "@/components/plan/MapPanel";
import MobileSheet from "@/components/plan/MobileSheet";
import PlanEmptyState from "@/components/plan/PlanEmptyState";
import TripInfoHeader from "@/components/plan/TripInfoHeader";
import InspectorPanel from "@/components/plan/InspectorPanel";
import FABGroup from "@/components/plan/FABGroup";

import { openPlanPrintFromNormalized } from "@/utils/export/planPdf";
import { t, getDefaultLocale } from "@/components/plan/strings";

import "@/styles/plan.layout.css";

// 오늘 날짜를 "YYYY-MM-DD" 포맷으로 반환
function todayISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function PlanPage() {
  const locale = getDefaultLocale();

  const navigate = useNavigate();
  const location = useLocation();

  const currentTripId = usePlanStore((s) => s.currentTripId);
  const hasExistingTrip = usePlanStore((s) =>
    Object.values(s.trips).some((t) => !t.isSample)
  );

  const currentTrip = usePlanStore(selectCurrentTrip);

  const currentDayId = usePlanUIStore((s) => s.currentDayId);
  const setCurrentDayId = usePlanUIStore((s) => s.setCurrentDayId);
  const isPlanSheetOpen = usePlanUIStore((s) => s.isPlanSheetOpen);
  const setPlanSheetOpen = usePlanUIStore((s) => s.setPlanSheetOpen);
  const lastSampleTripId = usePlanUIStore((s) => s.lastSampleTripId);
  const clearLastSampleTripId = usePlanUIStore((s) => s.clearLastSampleTripId);

  const hasTrip = !!currentTripId && !!currentTrip;

  // 🔹 현재 선택된 trip의 Day 리스트 (Day 탭 네비게이션용)
  const daysOfCurrentTrip = usePlanStore((s) =>
    currentTripId ? selectDaysOfTrip(s, currentTripId) : []
  );

  // 🔹 현재 Day의 인덱스 (0-based) 계산 → 모바일/데스크탑 공용 Day 라벨용
  const currentDayIndex = useMemo(() => {
    if (!currentDayId || !daysOfCurrentTrip.length) return null;
    const idx = (daysOfCurrentTrip as any[]).findIndex(
      (d: any) => d.id === currentDayId
    );
    return idx === -1 ? null : idx;
  }, [currentDayId, daysOfCurrentTrip]);

  // 샘플 일정 선택 후 돌아왔을 때 자동으로 해당 trip 활성화
  useEffect(() => {
    if (!lastSampleTripId) return;
    const st = usePlanStore.getState();

    const trip = (st as any).trips[lastSampleTripId];
    if (!trip) {
      clearLastSampleTripId();
      return;
    }

    // trip 선택
    usePlanStore.setState({ currentTripId: lastSampleTripId });

    // 첫 번째 Day를 현재 Day로 설정
    const firstDay = Object.values((st as any).days)
      .filter((d: any) => d.tripId === lastSampleTripId)
      .sort((a: any, b: any) => a.order - b.order)[0];

    if (firstDay) {
      setCurrentDayId(firstDay.id);
    }

    clearLastSampleTripId();
  }, [lastSampleTripId, clearLastSampleTripId, setCurrentDayId]);

  // 현재 선택된 trip이 바뀌었는데 currentDayId가 그 trip에 속하지 않으면 보정
  useEffect(() => {
    if (!currentTripId) return;

    const st = usePlanStore.getState();
    const daysOfTrip = Object.values((st as any).days).filter(
      (d: any) => d.tripId === currentTripId
    );

    if (daysOfTrip.length === 0) return;

    const existsInTrip = daysOfTrip.some((d: any) => d.id === currentDayId);
    if (currentDayId && existsInTrip) {
      return;
    }

    const firstDay = [...daysOfTrip].sort(
      (a: any, b: any) => a.order - b.order
    )[0];

    if (firstDay) {
      setCurrentDayId(firstDay.id);
    }
  }, [currentTripId, currentDayId, setCurrentDayId]);

  // PDF 내보내기용 데이터 정규화
  const exportPayload = usePlanStore((s) => {
    const trip = selectCurrentTrip(s);
    if (!trip) return null;

    const days = selectDaysOfTrip(s, trip.id);
    const items: any[] = [];
    days.forEach((d) => {
      // 각 Day의 아이템을 평탄화해서 모음
      items.push(...selectItemsOfDay(s, d.id));
    });
    const links = Object.values((s as any).links || {}).filter(
      (ln: any) => ln.tripId === trip.id
    );

    return { trip, days, items, links };
  });

  const handleExportPdf = () => {
    if (!exportPayload) {
      window.alert(t(locale, "planPage", "noTripToExport") as string);
      return;
    }
    openPlanPrintFromNormalized(
      exportPayload.trip,
      exportPayload.days,
      exportPayload.items,
      exportPayload.links
    );
  };

  // 빠른 새 일정 생성 (오늘 기준 2박 3일, 기본값)
  const createQuickTrip = () => {
    const st = usePlanStore.getState();
    const startISO = todayISODate();
    const tripId = st.createTrip({
      startDateISO: startISO,
      nights: 2,
      currency: "VND",
      budgetTotal: 0,
      transportDefault: "car",
    });

    const stAfter = usePlanStore.getState();
    const firstDay = Object.values((stAfter as any).days)
      .filter((d: any) => d.tripId === tripId)
      .sort((a: any, b: any) => a.order - b.order)[0];

    if (firstDay) {
      setCurrentDayId(firstDay.id);
    }

    navigate("/plan");
  };

  // 샘플 일정 선택 오버레이 열기
  const openSampleChooser = () => {
    navigate("/plan/sample", {
      state: { backgroundLocation: location, background: location },
    });
  };

  // 기존 플랜(샘플이 아닌 일정) 중 가장 최근 것 이어서 보기
  const openLastSavedTrip = () => {
    const st = usePlanStore.getState();

    const trips = Object.values((st as any).trips).filter(
      (t: any) => !t.isSample
    );
    if (trips.length === 0) {
      window.alert(t(locale, "planPage", "noSavedTrip") as string);
      return;
    }

    const sorted = [...trips].sort((a: any, b: any) => {
      const ta = (a as any).updatedAt || (a as any).createdAt;
      const tb = (b as any).updatedAt || (b as any).createdAt;
      if (ta === tb) return 0;
      return ta < tb ? 1 : -1; // 최신 순
    });

    const target: any = sorted[0];

    // 현재 선택된 trip 변경
    usePlanStore.setState({ currentTripId: target.id });

    // 해당 trip의 첫 번째 Day를 UI에 설정
    const firstDay = Object.values((st as any).days)
      .filter((d: any) => d.tripId === target.id)
      .sort((a: any, b: any) => a.order - b.order)[0];

    if (firstDay) {
      setCurrentDayId(firstDay.id);
    }

    navigate("/plan");
  };

  // 🔹 모바일 시트 타이틀 (Day 문맥 반영)
  const mobileSheetTitle = useMemo(() => {
    // trip이 없거나 Day 인덱스를 못 찾으면 기존 번역키 사용
    if (!hasTrip || currentDayIndex == null) {
      return t(locale, "planPage", "mobileTodayTitle") as string;
    }

    const dayNumber = currentDayIndex + 1;
    if (locale === "ko") {
      return `${dayNumber}일차 일정`;
    }
    return `Day ${dayNumber} Plan`;
  }, [hasTrip, currentDayIndex, locale]);

  // 모바일 하단 시트 푸터 (장소 추가 버튼) - currentDayId 기반 검색 페이지로 이동
  const mobileFooter = useMemo(
    () =>
      !hasTrip ? null : (
        <div className="flex justify-end border-t bg-white px-3 py-2 text-xs dark:border-gray-700 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => {
              if (!currentDayId) {
                window.alert("먼저 일정을 선택한 뒤 장소를 추가해 주세요.");
                return;
              }
              const searchPath = `/plan/search?dayId=${encodeURIComponent(
                String(currentDayId)
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
            {t(locale, "planPage", "mobileAddPlaceButton")}
          </button>
        </div>
      ),
    [hasTrip, locale, navigate, location, currentDayId]
  );

  return (
    <div className="plan-page flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* 데스크탑 레이아웃 */}
      <div className="hidden flex-1 flex-col md:flex">
        {hasTrip ? (
          <>
            {/* 상단 요약 영역 */}
            {/* 🔹 여기 z-index, relative 추가해서 지도 위로 나오게 함 */}
            <header className="relative z-20 border-b bg-white/80 px-4 pb-2 pt-3 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
              <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
                <PlanSummaryBar />
                <div className="shrink-0 pt-1">
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    {t(locale, "planPage", "pdfButton")}
                  </button>
                </div>
              </div>

              <div className="mx-auto mt-2 max-w-6xl">
                <TripInfoHeader />

                {/* 🔹 Day 네비게이션 탭 */}
                {daysOfCurrentTrip.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {daysOfCurrentTrip.map((day: any, index: number) => {
                      const isActive = day.id === currentDayId;
                      const label =
                        locale === "ko"
                          ? `${index + 1}일차`
                          : `Day ${index + 1}`;

                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => setCurrentDayId(day.id)}
                          className={[
                            "rounded-full border px-3 py-1 text-xs font-medium transition",
                            isActive
                              ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200",
                          ].join(" ")}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </header>

            {/* 메인 영역: 좌측 타임라인 / 우측 지도 */}
            <div className="mx-auto w-full max-w-6xl px-4 pb-6 pt-3">
              <div className="grid grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-4">
                {/* 좌측: Day / 타임라인 */}
                <aside>
                  <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <DaySidebar />
                  </div>
                </aside>

                {/* 우측: 지도 + 인스펙터 */}
                <main>
                  <div className="relative h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <MapPanel />
                    {/* 오른쪽에서 슬라이드되는 디테일 패널 */}
                    <InspectorPanel />
                  </div>
                </main>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center px-4 py-6">
            <div className="w-full max-w-xl">
              <PlanEmptyState
                hasExistingTrip={hasExistingTrip}
                onCreateNew={createQuickTrip}
                onOpenSample={openSampleChooser}
                onOpenExisting={openLastSavedTrip}
                locale={locale as any}
              />
            </div>
          </div>
        )}
      </div>

      {/* 모바일 레이아웃 */}
      <div className="flex flex-1 flex-col md:hidden">
        {hasTrip ? (
          <>
            <div className="flex-1 min-h-[320px]">
              <MapPanel />
            </div>

            <MobileSheet
              open={isPlanSheetOpen}
              onClose={() => setPlanSheetOpen(false)}
              title={mobileSheetTitle}
              initialSnap="large"
              footer={mobileFooter}
            >
              <div className="p-2">
                <DaySidebar />
              </div>
            </MobileSheet>

            {/* 모바일 전용 플로팅 FAB 그룹 */}
            <FABGroup />
          </>
        ) : (
          <div className="flex h-full items-center justify-center px-4 py-6">
            <div className="w-full max-w-xl">
              <PlanEmptyState
                hasExistingTrip={hasExistingTrip}
                onCreateNew={createQuickTrip}
                onOpenSample={openSampleChooser}
                onOpenExisting={openLastSavedTrip}
                locale={locale as any}
              />
            </div>
          </div>
        )}
      </div>

      <Outlet />
    </div>
  );
}
