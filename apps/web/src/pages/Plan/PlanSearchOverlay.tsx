// src/pages/Plan/PlanSearchOverlay.tsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { nanoid } from "nanoid";
import { usePlanStore } from "@/store/plan.store";
import { usePlanUIStore } from "@/store/plan.ui.store";
import {
  t,
  getDefaultLocale,
} from "@/components/plan/strings";
import { searchSpotsByText } from "@/api/spots.api";
import {
  searchByRadius,
  KIND_GROUPS,
} from "@/utils/poi/opentripmap";

// google.maps 타입이 없어도 빌드되도록 any 선언
declare const google: any;

/**
 * Google Places Text Search 기반 검색
 * - "/spots" 같은 로컬 REST API 대신, Google Places를 직접 사용
 * - 결과는 Plan에서 기대하는 객체 구조에 맞춰 정제해서 반환
 */
async function searchPlacesByText(
  query: string,
  _signal?: AbortSignal
) {
  if (!query) return [] as any[];

  if (typeof window === "undefined") return [] as any[];
  const g = (window as any).google;
  if (!g || !g.maps || !g.maps.places) {
    console.warn(
      "[PlanSearchOverlay] google.maps.places 가 로드되지 않았습니다."
    );
    return [] as any[];
  }

  return await new Promise<any[]>((resolve) => {
    try {
      const service = new g.maps.places.PlacesService(
        document.createElement("div")
      );

      const request = {
        query,
        // 베트남 여행 위주면 region/language는 필요에 따라 조정
        region: "vn",
        language: "ko",
      };

      service.textSearch(request, (results: any, status: any) => {
        if (
          status !== g.maps.places.PlacesServiceStatus.OK ||
          !Array.isArray(results)
        ) {
          resolve([]);
          return;
        }

        const mapped = results.map((r: any) => {
          const loc = r.geometry?.location;
          const lat =
            typeof loc?.lat === "function"
              ? loc.lat()
              : loc?.lat ?? undefined;
          const lng =
            typeof loc?.lng === "function"
              ? loc.lng()
              : loc?.lng ?? undefined;

          return {
            // 리스트 key, hoverSpotId 등에 쓰일 id
            id: r.place_id,
            place_id: r.place_id,
            name: r.name,
            address: r.formatted_address,
            location:
              lat != null && lng != null
                ? { lat, lng }
                : undefined,
            rating: r.rating,
            user_ratings_total: r.user_ratings_total,
            source: "google" as const,
          };
        });

        resolve(mapped);
      });
    } catch (e) {
      console.error(
        "[PlanSearchOverlay] Google Places 검색 중 오류:",
        e
      );
      resolve([]);
    }
  });
}

/** plan.store의 addItem 시그니처가 프로젝트별로 다를 수 있어 호환 래퍼 */
function addItemCompat(args: {
  dayId: string;
  tripId?: string | null;
  title: string;
  lat?: number;
  lng?: number;
  cost?: number;
  /** Plan PlaceLite 확장 필드들 */
  address?: string;
  source?: "google" | "spot" | "poi";
  placeId?: string;
  spotId?: string;
  poiId?: string;
}) {
  const st = usePlanStore.getState() as any;
  const addItem = st.addItem as any;
  const upsertPlaceFromGoogle =
    (st.upsertPlaceFromGoogle as ((g: any) => string) | undefined) ??
    undefined;

  const hasCoords =
    typeof args.lat === "number" && typeof args.lng === "number";

  let placeInternalId: string;

  /**
   * 1) Google 검색 결과 + upsertPlaceFromGoogle 가 있을 때:
   *    - googlePlaceId 기준으로 Place 재사용/업데이트
   * 2) 그 외(spot / poi / 좌표 없음 등):
   *    - 기존처럼 새 Place를 한 번 생성
   */
  const canUseUpsert =
    args.source === "google" &&
    !!args.placeId &&
    !!upsertPlaceFromGoogle &&
    hasCoords;

  if (canUseUpsert) {
    try {
      placeInternalId = upsertPlaceFromGoogle({
        googlePlaceId: args.placeId,
        name: args.title,
        lat: args.lat!,
        lng: args.lng!,
        address: args.address,
        formattedAddress: args.address,
        types: [],
        city: undefined,
        countryCode: undefined,
      });
    } catch (e) {
      console.error(
        "[PlanSearchOverlay] upsertPlaceFromGoogle 실패, 수동 Place 생성으로 fallback:",
        e
      );
      // 실패 시엔 기존 방식으로 Place 생성
      placeInternalId = nanoid();
      st.setState?.((prev: any) => ({
        ...prev,
        places: {
          ...prev.places,
          [placeInternalId]: {
            id: placeInternalId,
            name: args.title,
            address: args.address,
            lat: args.lat,
            lng: args.lng,
            source: args.source,
            placeId: args.placeId,
            spotId: args.spotId,
            poiId: args.poiId,
          },
        },
      }));
    }
  } else {
    // spot / poi / 좌표 없는 경우 → 기존 PlaceLite 스타일로 신규 Place 생성
    placeInternalId = nanoid();
    st.setState?.((prev: any) => ({
      ...prev,
      places: {
        ...prev.places,
        [placeInternalId]: {
          id: placeInternalId,
          name: args.title,
          address: args.address,
          lat: args.lat,
          lng: args.lng,
          source: args.source,
          placeId: args.placeId,
          spotId: args.spotId,
          poiId: args.poiId,
        },
      },
    }));
  }

  // 공통 payload (Item 쪽에는 placeId만 연결)
  const baseMin = 9 * 60;
  const payload = {
    id: nanoid(),
    tripId: args.tripId ?? undefined,
    dayId: args.dayId,
    type: "custom" as const,
    title: args.title,
    placeId: placeInternalId,
    timeStartMin: baseMin,
    timeEndMin: baseMin + 60,
    cost: args.cost ?? 0,
  };

  // ① 단일 객체 addItem(payload) ② (dayId, partial) 둘 다 대응
  try {
    if (typeof addItem === "function" && addItem.length >= 2) {
      const location =
        hasCoords && args.lat != null && args.lng != null
          ? { lat: args.lat, lng: args.lng }
          : undefined;

      addItem(args.dayId, {
        id: payload.id,
        title: payload.title,
        spotId: null,
        location,
        cost: payload.cost,
      });
    } else {
      addItem(payload);
    }
  } catch (e) {
    console.error("[PlanSearchOverlay] addItem 실패:", e);
  }
}

export default function PlanSearchOverlay() {
  const locale = getDefaultLocale();

  const navigate = useNavigate();
  const location = useLocation();

  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const paramDayId = params.get("dayId");

  const {
    currentDayId,
    setHoverSpotId,
    setCurrentDayId,
  } = usePlanUIStore((s: any) => ({
    currentDayId: s.currentDayId,
    setHoverSpotId: s.setHoverSpotId,
    setCurrentDayId: s.setCurrentDayId,
  }));

  const currentTripId = usePlanStore((s: any) => s.currentTripId);

  /** Plan 전체 상태에서 items/places/trips/days도 같이 읽기 (POI center + 헤더용) */
  const { itemsMap, placesMap, tripsMap, daysMap } = usePlanStore(
    (s: any) => ({
      itemsMap: s.items,
      placesMap: s.places,
      tripsMap: s.trips,
      daysMap: s.days,
    })
  );

  /** 탭 모드: Google / Spot / POI */
  const [mode, setMode] = useState<"google" | "spot" | "poi">(
    "google"
  );

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingSpot, setLoadingSpot] = useState(false);
  const [loadingPoi, setLoadingPoi] = useState(false);

  const [googleItems, setGoogleItems] = useState<any[]>([]);
  const [spotItems, setSpotItems] = useState<any[]>([]);
  const [poiItems, setPoiItems] = useState<any[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortGoogleRef = useRef<AbortController | null>(null);
  const abortSpotRef = useRef<AbortController | null>(null);

  // URL에 dayId가 있으면 현재 UI dayId와 동기화
  useEffect(() => {
    if (paramDayId && paramDayId !== currentDayId) {
      setCurrentDayId?.(paramDayId);
    }
  }, [paramDayId, currentDayId, setCurrentDayId]);

  // ESC 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const bg =
          (location.state as any)?.background ||
          (location.state as any)?.backgroundLocation;
        navigate(bg ?? "/plan", { replace: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [location.state, navigate]);

  /** 현재 Day/Trip 기준 */
  const effectiveDayId = paramDayId || currentDayId;

  const currentDayLabel = useMemo(() => {
    if (!effectiveDayId) return null;
    const day = daysMap?.[effectiveDayId];
    if (!day) return null;

    // day.order / day.dateISO 같은 필드가 있다고 가정
    const dayOrder =
      typeof day.order === "number" ? `Day ${day.order + 1}` : "";
    const dateLabel =
      typeof day.dateISO === "string" ? day.dateISO : "";
    if (dayOrder && dateLabel) return `${dayOrder} · ${dateLabel}`;
    if (dayOrder) return dayOrder;
    if (dateLabel) return dateLabel;
    return null;
  }, [effectiveDayId, daysMap]);

  /** 현재 Day/Trip 기준 POI 검색 중심 좌표 계산 */
  const poiCenter = useMemo(() => {
    // 1) 현재 Day에 있는 아이템들의 위치 평균
    if (effectiveDayId) {
      const itemsOfDay = Object.values(itemsMap || {}).filter(
        (it: any) => it.dayId === effectiveDayId
      );
      const coords: { lat: number; lng: number }[] = [];
      for (const it of itemsOfDay) {
        if (!it.placeId) continue;
        const p = placesMap[it.placeId];
        if (
          p &&
          typeof p.lat === "number" &&
          typeof p.lng === "number"
        )
          coords.push({ lat: p.lat, lng: p.lng });
      }
      if (coords.length > 0) {
        const lat =
          coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
        const lng =
          coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;
        return { lat, lng };
      }
    }

    // 2) Trip의 baseHotel 위치 사용
    if (currentTripId) {
      const trip = tripsMap[currentTripId];
      if (trip?.baseHotelId) {
        const p = placesMap[trip.baseHotelId];
        if (
          p &&
          typeof p.lat === "number" &&
          typeof p.lng === "number"
        ) {
          return { lat: p.lat, lng: p.lng };
        }
      }
    }

    // 3) 아무것도 없으면 null → POI 탭에서 안내 문구
    return null;
  }, [effectiveDayId, itemsMap, placesMap, tripsMap, currentTripId]);

  // Google 검색
  useEffect(() => {
    if (!q) {
      setGoogleItems([]);
      setLoadingGoogle(false);
      return;
    }
    setLoadingGoogle(true);
    abortGoogleRef.current?.abort();
    const ctrl = new AbortController();
    abortGoogleRef.current = ctrl;

    const tId = setTimeout(async () => {
      try {
        const list = await searchPlacesByText(q, ctrl.signal);
        setGoogleItems(list);
      } catch {
        // 취소 등은 무시
      } finally {
        setLoadingGoogle(false);
      }
    }, 300);

    return () => {
      clearTimeout(tId);
      ctrl.abort();
    };
  }, [q]);

  // Spot DB 검색
  useEffect(() => {
    if (!q) {
      setSpotItems([]);
      setLoadingSpot(false);
      return;
    }
    setLoadingSpot(true);
    abortSpotRef.current?.abort();
    const ctrl = new AbortController();
    abortSpotRef.current = ctrl;

    const tId = setTimeout(async () => {
      try {
        const spots = await searchSpotsByText("explorer", q);
        const mapped = spots.map((s) => {
          const lat = s.latitude;
          const lng = s.longitude;
          return {
            id: s.id,
            name: s.name,
            address: s.address,
            location:
              typeof lat === "number" && typeof lng === "number"
                ? { lat, lng }
                : undefined,
            rating: s.rating,
            reviewCount: s.reviewCount,
            source: "spot" as const,
            spotId: s.id,
            price: s.averageSpend,
          };
        });
        setSpotItems(mapped);
      } catch {
        // 무시
      } finally {
        setLoadingSpot(false);
      }
    }, 300);

    return () => {
      clearTimeout(tId);
      ctrl.abort();
    };
  }, [q]);

  // POI(관광지) 검색 — 텍스트와 무관하게, center 기준 추천
  useEffect(() => {
    if (mode !== "poi") return;
    if (!poiCenter) {
      setPoiItems([]);
      setLoadingPoi(false);
      return;
    }

    setLoadingPoi(true);
    let cancelled = false;

    (async () => {
      try {
        const list = await searchByRadius({
          lat: poiCenter.lat,
          lon: poiCenter.lng,
          radius: 5000, // 5km 반경
          kinds: KIND_GROUPS.sights, // 관광지 위주
          limit: 40,
          rate: 2, // 어느 정도 인기 있는 곳 위주
        });
        if (cancelled) return;
        const mapped = list.map((p) => ({
          id: p.xid,
          name: p.name || "관광지",
          // 주소 필드는 OpenTripMap에서 깔끔히 안 오므로 kinds를 임시로 보조 설명으로 사용
          address: p.kinds,
          location: {
            lat: p.lat,
            lng: p.lon,
          },
          source: "poi" as const,
          poiId: p.xid,
          rate: p.rate,
        }));
        setPoiItems(mapped);
      } catch (e) {
        if (!cancelled) {
          console.error(
            "[PlanSearchOverlay] OpenTripMap 검색 오류:",
            e
          );
          setPoiItems([]);
        }
      } finally {
        if (!cancelled) setLoadingPoi(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, poiCenter?.lat, poiCenter?.lng]);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const val = (e.currentTarget as HTMLFormElement)
        .q as unknown as HTMLInputElement;
      setParams((old) => {
        const np = new URLSearchParams(old);
        if (val.value) np.set("q", val.value);
        else np.delete("q");
        return np;
      });
    },
    [setParams]
  );

  const close = useCallback(() => {
    const bg =
      (location.state as any)?.background ||
      (location.state as any)?.backgroundLocation;
    navigate(bg ?? "/plan", { replace: true });
  }, [location.state, navigate]);

  const addToDay = useCallback(
    (spot: any) => {
      if (!effectiveDayId) {
        window.alert(
          t(locale, "search", "selectDayWarning") as string
        );
        return;
      }

      // 위치 추출 (google / spot / poi / 커스텀 모두 대응)
      const rawLoc =
        spot.location ?? spot.geometry?.location ?? null;

      let lat: number | undefined;
      let lng: number | undefined;

      if (rawLoc) {
        lat =
          typeof rawLoc.lat === "function"
            ? rawLoc.lat()
            : rawLoc.lat ?? rawLoc.latitude;
        lng =
          typeof rawLoc.lng === "function"
            ? rawLoc.lng()
            : rawLoc.lng ?? rawLoc.longitude;
      }

      if (lat == null && spot.lat != null) {
        lat = spot.lat;
      }
      if (lng == null && spot.lng != null) {
        lng = spot.lng;
      }
      if (lat == null && spot.latitude != null) {
        lat = spot.latitude;
      }
      if (lng == null && spot.longitude != null) {
        lng = spot.longitude;
      }

      addItemCompat({
        dayId: effectiveDayId,
        tripId: currentTripId ?? null,
        title: spot.name ?? spot.title ?? "스팟",
        lat,
        lng,
        cost: spot.price ?? spot.averageSpend ?? 0,
        address: spot.address ?? spot.formatted_address,
        source: spot.source,
        placeId: spot.place_id,
        spotId:
          spot.spotId ??
          (spot.source === "spot" ? spot.id : undefined),
        poiId:
          spot.poiId ??
          (spot.source === "poi" ? spot.id : undefined),
      });
      close();
    },
    [effectiveDayId, currentTripId, close, locale]
  );

  const results = useMemo(() => {
    if (mode === "google") return googleItems;
    if (mode === "spot") return spotItems;
    return poiItems;
  }, [mode, googleItems, spotItems, poiItems]);

  const loading = useMemo(() => {
    if (mode === "google") return loadingGoogle;
    if (mode === "spot") return loadingSpot;
    return loadingPoi;
  }, [mode, loadingGoogle, loadingSpot, loadingPoi]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-x-0 top-10 mx-auto w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-black/10 dark:bg-gray-900">
        {/* 상단 헤더: 타이틀 + 현재 Day 안내 문구 */}
        <div className="border-b px-4 py-3 dark:border-gray-800">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {t(locale, "search", "title") ?? "장소 검색"}
              </div>
              <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {currentDayLabel ? (
                  <>현재 선택된 일정: {currentDayLabel}</>
                ) : (
                  <>하루를 먼저 선택하거나 생성한 후 장소를 추가해 주세요.</>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-full border px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t(locale, "search", "closeButton")}
            </button>
          </div>
        </div>

        {/* 검색 폼 */}
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 border-b px-4 py-2.5 dark:border-gray-800"
        >
          <input
            ref={inputRef}
            name="q"
            defaultValue={q}
            autoFocus
            placeholder={
              (t(locale, "search", "placeholder") as string) ??
              "장소 이름, 카페, 명소 등을 입력하세요"
            }
            className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50 dark:placeholder:text-gray-500"
          />
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {t(locale, "search", "searchButton")}
          </button>
        </form>

        {/* 탭 / 토글 (Google vs Spot vs POI) */}
        <div className="flex items-center justify-between border-b px-4 py-2 text-xs dark:border-gray-800">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setMode("google")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                mode === "google"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => setMode("spot")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                mode === "spot"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              내 스팟
            </button>
            <button
              type="button"
              onClick={() => setMode("poi")}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                mode === "poi"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              관광지 추천
            </button>
          </div>
          {mode === "poi" && poiCenter && (
            <span className="hidden text-[11px] text-gray-400 sm:inline">
              현재 일정 주변 약 5km 반경 기준 추천
            </span>
          )}
        </div>

        {/* 결과 리스트 */}
        <div className="max-h-[70vh] overflow-y-auto bg-white dark:bg-gray-900">
          {mode === "poi" && !poiCenter && (
            <div className="px-4 pt-3 text-xs text-amber-600 dark:text-amber-300">
              현재 Day에 등록된 장소나 기준 위치가 없어서 주변
              관광지를 찾기 어렵습니다. 먼저 하루 일정에 최소 한 곳
              이상을 추가해 주세요.
            </div>
          )}

          {loading ? (
            <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
              {t(locale, "search", "loading")}
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
              {t(locale, "search", "empty")}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {results.map((r: any) => (
                <li
                  key={r.id ?? r.place_id ?? nanoid()}
                  className="flex items-start justify-between gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/80"
                  onMouseEnter={() =>
                    setHoverSpotId?.(r.id ?? r.place_id)
                  }
                  onMouseLeave={() => setHoverSpotId?.(null)}
                >
                  <div className="min-w-0 flex-1">
                    {/* 이름(타이틀) */}
                    <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">
                      {r.name ?? r.title}
                    </div>

                    {/* 주소 */}
                    <div className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                      {r.address ?? r.formatted_address ?? ""}
                    </div>

                    {/* 부가 정보 */}
                    <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-400 dark:text-gray-500">
                      {r.source === "google" &&
                        r.user_ratings_total != null && (
                          <span>
                            리뷰 {r.user_ratings_total}개
                            {r.rating &&
                              ` · ★ ${Number(r.rating).toFixed(1)}`}
                          </span>
                        )}
                      {r.source === "spot" &&
                        (r.reviewCount != null || r.rating != null) && (
                          <span>
                            내 스팟 · 리뷰 {r.reviewCount ?? 0}개
                            {r.rating &&
                              ` · ★ ${Number(r.rating).toFixed(1)}`}
                          </span>
                        )}
                      {r.source === "poi" && r.rate != null && (
                        <span className="text-emerald-600 dark:text-emerald-300">
                          추천 지수 {r.rate}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
                    onClick={() => addToDay(r)}
                  >
                    {t(locale, "search", "addButton")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-between border-t px-4 py-2 text-[11px] text-gray-400 dark:border-gray-800 dark:text-gray-500">
          <span>{t(locale, "search", "tip")}</span>
          {currentDayLabel && (
            <span>이 일정에 추가된 장소는 지도와 경로에 바로 반영됩니다.</span>
          )}
        </div>
      </div>
    </div>
  );
}
