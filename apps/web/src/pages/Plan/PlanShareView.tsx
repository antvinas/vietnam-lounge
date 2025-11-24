// pages/Plan/PlanShareView.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { usePlanStore } from "@/store/plan.store";
import type { Day as StoreDay, Item as StoreItem, Trip as StoreTrip } from "@/store/plan.store";

import { getTripGraph } from "@/services/plans";
import type { Trip as RemoteTrip, Day as RemoteDay, Item as RemoteItem, Link as RemoteLink } from "@/types/plan";

// 분 단위를 "HH:MM" 형태로 변환
function formatMinutes(total?: number | null) {
  if (total == null) return "";
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

// Day 타이틀 라벨
function getDayTitle(day: { order?: number; dateISO?: string }, index: number) {
  const base = `Day ${day.order ?? index + 1}`;
  if (!day.dateISO) return base;
  return `${base} · ${day.dateISO}`;
}

type NormalizedTripGraph = {
  trip: {
    id: string;
    title?: string;
    currency?: string;
    dateStartISO?: string;
    dateEndISO?: string;
  };
  days: { id: string; order: number; dateISO?: string }[];
  items: {
    id: string;
    dayId: string;
    title: string;
    timeStartMin?: number | null;
    timeEndMin?: number | null;
    cost?: number | null;
    type?: string | null;
  }[];
};

/**
 * 로컬 store Trip/Day/Item → 공유 뷰용 정규화
 */
function normalizeFromStore(
  trip: StoreTrip,
  days: StoreDay[],
  items: StoreItem[]
): NormalizedTripGraph {
  const dateStartISO = (trip as any).dateStartISO || (trip as any).startDateISO;
  const dateEndISO =
    (trip as any).dateEndISO ||
    (trip as any).endDateISO ||
    (trip as any).finishDateISO;
  return {
    trip: {
      id: (trip as any).id,
      title: (trip as any).title,
      currency: (trip as any).currency ?? "VND",
      dateStartISO,
      dateEndISO,
    },
    days: [...days]
      .map((d) => ({
        id: (d as any).id,
        order: (d as any).order ?? 1,
        dateISO: (d as any).dateISO,
      }))
      .sort((a, b) => a.order - b.order),
    items: items.map((it) => ({
      id: (it as any).id,
      dayId: (it as any).dayId,
      title: (it as any).title ?? "(제목 없음)",
      timeStartMin: (it as any).timeStartMin,
      timeEndMin: (it as any).timeEndMin,
      cost: (it as any).cost,
      type: (it as any).type,
    })),
  };
}

/**
 * 원격 Trip/Day/Item → 공유 뷰용 정규화
 */
function normalizeFromRemote(
  trip: RemoteTrip,
  days: RemoteDay[],
  items: RemoteItem[]
): NormalizedTripGraph {
  const dateStartISO = (trip as any).dateStartISO || (trip as any).startDateISO;
  const dateEndISO =
    (trip as any).dateEndISO ||
    (trip as any).dateEnd ||
    (trip as any).finishDateISO;
  return {
    trip: {
      id: (trip as any).id,
      title: (trip as any).title,
      currency: (trip as any).currency ?? "VND",
      dateStartISO,
      dateEndISO,
    },
    days: [...days]
      .map((d) => ({
        id: (d as any).id,
        order: (d as any).order ?? 1,
        dateISO: (d as any).dateISO,
      }))
      .sort((a, b) => a.order - b.order),
    items: items.map((it) => ({
      id: (it as any).id,
      dayId: (it as any).dayId,
      title: (it as any).title ?? "(제목 없음)",
      timeStartMin: (it as any).timeStartMin,
      timeEndMin: (it as any).timeEndMin,
      cost: (it as any).cost,
      type: (it as any).type,
    })),
  };
}

export default function PlanShareView() {
  const { id } = useParams<{ id: string }>();
  const shareId = id ?? "";

  // 1) 먼저 로컬 store에서 시도
  const localTrip = usePlanStore<StoreTrip | undefined>((s) =>
    shareId ? (s.trips as any)[shareId] : undefined
  );

  const localDays = usePlanStore<StoreDay[]>((s) =>
    shareId
      ? Object.values(s.days as any).filter(
          (d: any) => d.tripId === shareId
        )
      : []
  );

  const localItems = usePlanStore<StoreItem[]>((s) =>
    shareId
      ? Object.values(s.items as any).filter(
          (it: any) => it.tripId === shareId
        )
      : []
  );

  // 2) 서버에서 가져온 경우
  const [remote, setRemote] = useState<NormalizedTripGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) return;
    // 로컬에 이미 trip이 있으면 서버 호출은 생략 가능
    if (localTrip) {
      setRemote(null);
      setLoading(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const graph = await getTripGraph(shareId);
        if (!graph) {
          if (!cancelled) {
            setRemote(null);
            setLoadError("공유된 플랜을 찾을 수 없어요.");
          }
          return;
        }
        if (!cancelled) {
          setRemote(
            normalizeFromRemote(
              graph.trip as any,
              graph.days as any,
              graph.items as any
            )
          );
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError("공유된 플랜을 불러오는 중 오류가 발생했어요.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shareId, localTrip]);

  const normalized: NormalizedTripGraph | null = useMemo(() => {
    if (localTrip) {
      return normalizeFromStore(
        localTrip as any,
        localDays as any,
        localItems as any
      );
    }
    if (remote) return remote;
    return null;
  }, [localTrip, localDays, localItems, remote]);

  if (!shareId) {
    return (
      <div className="p-6 text-sm text-gray-500">
        잘못된 공유 링크입니다. 링크가 올바른지 확인해 주세요.
      </div>
    );
  }

  if (loading && !normalized) {
    return (
      <div className="p-6 text-sm text-gray-500">
        공유된 여행 플랜을 불러오는 중입니다…
      </div>
    );
  }

  if (!normalized) {
    return (
      <div className="p-6 text-sm text-gray-500">
        {loadError ??
          "공유된 여행 플랜을 찾을 수 없어요. 링크가 잘못되었거나, 이 브라우저/계정에서 접근 권한이 없을 수 있어요."}
      </div>
    );
  }

  const { trip, days, items } = normalized;

  const subtitlePieces: string[] = [];
  if (trip.dateStartISO && trip.dateEndISO) {
    subtitlePieces.push(`${trip.dateStartISO} ~ ${trip.dateEndISO}`);
  } else if (days.length > 0 && days[0].dateISO && days[days.length - 1].dateISO) {
    subtitlePieces.push(`${days[0].dateISO} ~ ${days[days.length - 1].dateISO}`);
  }
  if (days.length) {
    subtitlePieces.push(`${days.length}일`);
  }
  if (trip.currency) {
    subtitlePieces.push(trip.currency);
  }
  const subtitle = subtitlePieces.join(" · ");

  const itemsByDay = useMemo(() => {
    const map: Record<string, typeof items> = {};
    for (const d of days) {
      map[d.id] = items
        .filter((it) => it.dayId === d.id)
        .sort(
          (a, b) =>
            (a.timeStartMin ?? 0) - (b.timeStartMin ?? 0)
        );
    }
    return map;
  }, [days, items]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {trip.title || "공유된 여행 플랜"}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {/* 나중에: 이 플랜을 내 계정으로 복사, PDF 내보내기, 링크 복사 등 버튼 추가 가능 */}
      </header>

      {/* Day별 일정 뷰 */}
      <section className="space-y-4">
        {days.map((day, index) => {
          const dayItems = itemsByDay[day.id] ?? [];

          return (
            <div
              key={day.id}
              className="rounded-lg border p-4 dark:border-gray-800"
            >
              <h2 className="mb-2 text-sm font-semibold">
                {getDayTitle(day, index)}
              </h2>

              {dayItems.length === 0 ? (
                <p className="text-xs text-gray-400">
                  아직 등록된 일정이 없어요.
                </p>
              ) : (
                <ol className="space-y-2">
                  {dayItems.map((it) => {
                    const timeLabel = formatMinutes(it.timeStartMin);
                    const costLabel =
                      typeof it.cost === "number" && it.cost > 0
                        ? `${it.cost.toLocaleString()} ${
                            trip.currency ?? "VND"
                          }`
                        : "";
                    return (
                      <li
                        key={it.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div>
                          {timeLabel && (
                            <span className="mr-2 tabular-nums text-gray-500">
                              {timeLabel}
                            </span>
                          )}
                          <span>{it.title}</span>
                        </div>
                        {costLabel && (
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            {costLabel}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
