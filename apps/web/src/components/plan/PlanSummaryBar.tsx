// apps/web/src/components/plan/PlanSummaryBar.tsx
import React from "react";
import {
  usePlanStore,
  selectCurrentTrip,
  selectDaysOfTrip,
  selectItemsOfDay,
  selectConflictsOfDay,
} from "@/store/plan.store";
import { usePlanUIStore } from "@/store/plan.ui.store";
import { shallow } from "zustand/shallow";
import { buildGoogleDirectionsUrl } from "@/lib/googleDirections";
import { useDayRoute } from "@/hooks/useDayRoute";

type ChipKind = "neutral" | "warn";

function Chip(props: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  kind?: ChipKind;
  /** 숫자를 한 단계 더 눈에 띄게 */
  emphasis?: boolean;
}) {
  const { icon, label, value, kind = "neutral", emphasis = false } = props;

  const base =
    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs";
  const theme =
    kind === "warn"
      ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-900/20 dark:text-amber-100"
      : "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-100";

  const valueClass = emphasis
    ? "tabular-nums text-sm font-semibold"
    : "tabular-nums text-xs";

  return (
    <div className={`${base} ${theme}`}>
      {icon && <span aria-hidden>{icon}</span>}
      <span className="font-medium">{label}</span>
      {value && <span className={valueClass}>{value}</span>}
    </div>
  );
}

export default function PlanSummaryBar() {
  const trip = usePlanStore(selectCurrentTrip);
  const days = usePlanStore((s) => selectDaysOfTrip(s, trip?.id)) || [];
  const currentDayId =
    usePlanUIStore((s) => s.currentDayId) ?? days[0]?.id ?? null;

  // 현재 Day 인덱스 (0-based)
  const currentDayIndex =
    currentDayId && days.length > 0
      ? days.findIndex((d: any) => d.id === currentDayId)
      : -1;

  // "오늘" 대신 Day 문맥 라벨 (ex: "1일차")
  const dayLabelForSummary =
    currentDayIndex >= 0 ? `${currentDayIndex + 1}일차` : "오늘";

  // 전체 trip 기준 예산 잔액
  const { currency, budgetLeft } = usePlanStore(
    (s) => {
      const id = trip?.id ?? s.currentTripId ?? "";
      const spent = Object.values(s.items)
        .filter((it: any) => it.tripId === id)
        .reduce((a, it: any) => a + (it.cost ?? 0), 0);
      const total = s.trips[id]?.budgetTotal ?? 0;
      return {
        currency: s.trips[id]?.currency ?? "VND",
        budgetLeft: Math.max(0, total - spent),
      };
    },
    shallow
  );

  // 현재 Day 기준: 아이템/충돌/이동시간 + 구글 길찾기용 좌표(dayPoints)
  const { dayItems, conflictCount, travelMinutesOfDay, dayPoints } =
    usePlanStore(
      (s) => {
        if (!currentDayId) {
          return {
            dayItems: [] as any[],
            conflictCount: 0,
            travelMinutesOfDay: 0,
            dayPoints: [] as { lat: number; lng: number }[],
          };
        }

        const items = selectItemsOfDay(s, currentDayId);
        const conflicts = selectConflictsOfDay(s, currentDayId);

        // 기존 move 아이템 기반 이동시간 (fallback 용)
        const travelMinutes = items.reduce(
          (acc, it: any) =>
            acc + (it.type === "move" ? it.durationMin ?? 0 : 0),
          0
        );

        const places = s.places || {};
        const points: { lat: number; lng: number }[] = items
          .map((it: any) => {
            if (!it.placeId) return null;
            const p = places[it.placeId];
            if (!p || typeof p.lat !== "number" || typeof p.lng !== "number")
              return null;
            return {
              lat: p.lat as number,
              lng: p.lng as number,
            };
          })
          .filter(
            (p): p is { lat: number; lng: number } =>
              !!p
          );

        return {
          dayItems: items,
          conflictCount: conflicts.length,
          travelMinutesOfDay: travelMinutes,
          dayPoints: points,
        };
      },
      shallow
    );

  // Google Directions 기반 총 이동 시간 (초 단위) – useDayRoute에서 가져옴
  const { durationSecTotal } = useDayRoute();
  const travelMinutesDisplay =
    typeof durationSecTotal === "number" && durationSecTotal > 0
      ? Math.round(durationSecTotal / 60)
      : travelMinutesOfDay;

  const canOpenDirections =
    !!trip && !!currentDayId && dayPoints.length >= 2;

  const handleOpenDayDirections = () => {
    if (!trip || !currentDayId) return;
    if (dayPoints.length < 2) return;

    const origin = dayPoints[0];
    const destination = dayPoints[dayPoints.length - 1];
    const waypoints =
      dayPoints.length > 2 ? dayPoints.slice(1, -1) : undefined;

    const url = buildGoogleDirectionsUrl({
      origin,
      destination,
      waypoints,
      travelMode: "driving",
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!trip) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* 샘플 일정 여부 */}
      {trip.isSample && <Chip icon="⭐" label="샘플 일정" value="" />}

      {/* 예산: 남은 예산 기준으로 표시 (강조) */}
      <Chip
        icon="₫"
        label="예산 잔액"
        value={`${budgetLeft.toLocaleString()} ${currency}`}
        kind={budgetLeft <= 0 ? "warn" : "neutral"}
        emphasis
      />

      {/* 현재 Day의 일정 수 */}
      {currentDayId && (
        <Chip
          icon="📅"
          label={`${dayLabelForSummary} 일정`}
          value={`${dayItems.length}건`}
        />
      )}

      {/* 이동 시간(현재 Day) – Directions 결과 우선 사용 (강조) */}
      {currentDayId && (
        <Chip
          icon="🚶‍♂️"
          label={`이동 시간(${dayLabelForSummary})`}
          value={`${travelMinutesDisplay}분`}
          emphasis
        />
      )}

      {/* 겹치는 일정 */}
      <Chip
        icon="⚠️"
        label="겹치는 일정"
        value={`${conflictCount}건`}
        kind={conflictCount > 0 ? "warn" : "neutral"}
      />

      {/* Day 전체 Google Maps 길찾기 버튼 */}
      {canOpenDirections && (
        <button
          type="button"
          onClick={handleOpenDayDirections}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-100 dark:hover:bg-blue-900"
        >
          <span aria-hidden>🗺</span>
          <span>{dayLabelForSummary} 일정 길찾기 (Google)</span>
        </button>
      )}
    </div>
  );
}
