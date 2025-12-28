import React from "react";

import DaySidebar from "@/features/plan/components/day/DaySidebar";
import PlanSummaryBar from "@/features/plan/components/layout/PlanSummaryBar";
import MapPanel from "@/features/plan/components/map/MapPanel";
import MobileSheet from "@/features/plan/components/layout/MobileSheet";
import { PlanEmptyState } from "@/features/plan/components/plan/PlanEmptyState";
import TripInfoHeader from "@/features/plan/components/plan/TripInfoHeader";
import InspectorPanel from "@/features/plan/components/plan/InspectorPanel";
import MobileDetailSheet from "@/features/plan/components/plan/MobileDetailSheet";
import { FABGroup } from "@/features/plan/components/layout/FABGroup";

import "@/styles/plan.layout.css";

interface PlanShellProps {
  locale: string;
  hasTrip: boolean;
  hasExistingTrip: boolean;

  currentTrip?: any | null;

  currentDayId: string | null;
  daysOfCurrentTrip: any[];

  isPlanSheetOpen: boolean;
  mobileSheetTitle: string;
  mobileFooter: React.ReactNode;

  onChangeDay: (dayId: string) => void;
  onTogglePlanSheet: (open: boolean) => void;

  onExportPdf: () => void;
  onCreateQuickTrip: () => void;
  onOpenSampleChooser: () => void;
  onImportSample: (templateId: string) => void;
  onOpenLastSavedTrip: () => void;
  onClosePlan: () => void;
}

export function PlanShell(props: PlanShellProps) {
  const {
    locale,
    hasTrip,
    hasExistingTrip,
    currentDayId,
    daysOfCurrentTrip,
    isPlanSheetOpen,
    mobileSheetTitle,
    mobileFooter,
    onChangeDay,
    onTogglePlanSheet,
    onExportPdf,
    onCreateQuickTrip,
    onOpenSampleChooser,
    onImportSample,
    onOpenLastSavedTrip,
    onClosePlan,
  } = props;

  // ✅ currentDayId가 순간적으로 null이어도 UI가 비지 않도록 fallback
  const safeDayId = currentDayId ?? daysOfCurrentTrip?.[0]?.id ?? null;

  const emptyState = (
    <div className="flex h-full w-full items-center justify-center bg-slate-900">
      <PlanEmptyState
        locale={locale as any}
        hasExistingTrip={hasExistingTrip}
        onCreateNew={onCreateQuickTrip}
        onOpenSample={onOpenSampleChooser}
        onImportSample={onImportSample}
        onOpenExisting={onOpenLastSavedTrip}
      />
    </div>
  );

  const dayTabs =
    daysOfCurrentTrip.length > 0 ? (
      <div className="mt-2 flex flex-wrap gap-1.5 px-4 pb-2">
        {daysOfCurrentTrip.map((day: any, index: number) => {
          const isActive = day.id === safeDayId;
          const label = locale === "ko" ? `${index + 1}일차` : `Day ${index + 1}`;

          return (
            <button
              key={day.id}
              type="button"
              onClick={() => onChangeDay(day.id)}
              className={[
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                isActive
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>
    ) : null;

  const desktopHeader = (
    <header className="z-20 border-b border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-14 items-center justify-between gap-4 px-4">
        <div className="flex flex-1 items-center gap-3 overflow-hidden">
          <button
            type="button"
            onClick={onClosePlan}
            className="flex shrink-0 items-center justify-center rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            title="메인 화면으로 돌아가기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="flex-1 min-w-0">
            <PlanSummaryBar />
          </div>
        </div>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onExportPdf}
            className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            PDF
          </button>
        </div>
      </div>

      <div className="pt-1">
        <div className="px-4">
          <TripInfoHeader />
        </div>
        {dayTabs}
      </div>
    </header>
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-slate-950">
      <div className="hidden h-full flex-col md:flex">
        {hasTrip ? (
          <>
            {desktopHeader}

            <div className="flex flex-1 flex-row overflow-hidden">
              <aside className="w-[380px] flex-shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="h-full w-full overflow-hidden">
                  <DaySidebar dayId={safeDayId} />
                </div>
              </aside>

              <main className="relative flex-1 bg-slate-100 dark:bg-slate-950">
                <MapPanel />
                <InspectorPanel />
              </main>
            </div>
          </>
        ) : (
          emptyState
        )}
      </div>

      <div className="flex h-full flex-col md:hidden">
        {hasTrip ? (
          <div className="flex flex-1 flex-col">
            <div className="flex-1">
              <MapPanel />
            </div>
            <MobileSheet
              open={isPlanSheetOpen}
              onClose={() => onTogglePlanSheet(false)}
              title={mobileSheetTitle}
              initialSnap="large"
              footer={mobileFooter}
            >
              <div className="h-full px-2">
                <DaySidebar dayId={safeDayId} />
              </div>
            </MobileSheet>
            <MobileDetailSheet />
            <FABGroup />
          </div>
        ) : (
          emptyState
        )}
      </div>
    </div>
  );
}
