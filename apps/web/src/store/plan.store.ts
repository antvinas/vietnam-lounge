// src/store/plan.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import { addDays, parseISO, formatISO } from "date-fns";
import { getMatrix } from "@/services/distance";
import { usePlanUIStore } from "@/store/plan.ui.store";
import { getTemplate } from "@/data/plan.templates";
import type {
  TemplateId,
  SampleGenOptions,
  ItemSeed,
} from "@/types/plan.template";
import type {
  TransportMode,
  Place,
  Trip,
  Day,
  Item,
  Link,
  EntityMap,
} from "@/types/plan";

export type ItemType = import("@/types/plan").ItemType;

/**
 * Google Places API 결과에서 우리가 쓰는 최소 필드 형태
 *  - 실제 구현에서는 별도 타입으로 빼도 되지만
 *    우선 store 내부에서만 사용
 */
export type GooglePlaceLike = {
  googlePlaceId: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  formattedAddress?: string;
  types?: string[];
  city?: string;
  countryCode?: string;
};

export interface PlanState {
  trips: EntityMap<Trip>;
  days: EntityMap<Day>;
  items: EntityMap<Item>;
  links: EntityMap<Link>;
  /** Place = 위치에 대한 단일 진실 */
  places: EntityMap<Place>;
  currentTripId: string | null;

  createTrip: (input: {
    startDateISO: string;
    nights: number;
    currency: string;
    budgetTotal: number;
    transportDefault: TransportMode;
    baseHotel?: Omit<Place, "id"> & { id?: string };
    /** 내부용: 샘플로 생성하려면 true */
    isSample?: boolean;
  }) => string;

  setBudgetTotal: (tripId: string, budgetTotal: number) => void;
  setCurrency: (tripId: string, currency: string) => void;
  setTransportDefault: (tripId: string, mode: TransportMode) => void;
  setBaseHotel: (tripId: string, place: Place) => void;

  /**
   * Google Places API 결과 기반으로 Place upsert
   *  - googlePlaceId 로 기존 Place 검색
   *  - 있으면 좌표/주소 등을 최신 값으로 갱신
   *  - 없으면 새 Place 생성
   *  - 항상 최종 placeId 반환
   */
  upsertPlaceFromGoogle: (g: GooglePlaceLike) => string;

  addDay: (tripId: string, dateISO: string, afterOrder?: number) => string;
  removeDay: (dayId: string) => void;
  reorderDays: (tripId: string, orderedDayIds: string[]) => void;

  /**
   * Item 추가
   *
   * - 시간 배치 규칙은 "호출하는 쪽"에서 결정해서 넘긴다.
   *   예) 검색에서 추가 시 09:00~10:00, 샘플 템플릿은 template.timeStartMin/timeEndMin
   * - 이 함수는 전달받은 timeStartMin/timeEndMin을 clamp만 하고 그대로 저장한다.
   */
  addItem: (input: Omit<Item, "id"> & { id?: string }) => string;

  updateItem: (itemId: string, patch: Partial<Item>) => void;

  /**
   * Item을 다른 Day로 이동시키면서, 새 Day 내에서의 시간 범위를 "자동 배치"한다.
   *
   * 규칙:
   *  - duration = max(15분, 기존 (timeEndMin - timeStartMin))
   *  - toDayId의 아이템들을 시작시간 오름차순으로 정렬한 뒤 newIndex 위치에 끼워 넣는다.
   *    - prev & next 둘 다 있으면:
   *        windowStart = prev.timeEndMin
   *                      또는 없으면 (prev.timeStartMin + 60분)
   *        windowEnd   = next.timeStartMin
   *                      또는 없으면 next.timeEndMin (없으면 기본 10:00 가정)
   *        → window 안에서 duration을 맞춰 newStart를 결정
   *    - 맨 앞으로 보낼 때(!prev && next):
   *        next.timeStartMin - duration 을 기본으로 하되, 없으면 09:00 기준
   *    - 맨 뒤로 보낼 때(prev && !next):
   *        prev.timeEndMin 기준으로 뒤에 붙이고, 없으면 09:00 기준
   *    - 대상 Day에 아무 아이템도 없고, 기존 timeStartMin도 없으면:
   *        09:00 에서 시작해서 duration만큼 배치
   */
  moveItemToDay: (itemId: string, toDayId: string, newIndex?: number) => void;

  /**
   * 동일 Day 내에서 순서를 재배치 (DnD용)
   *
   * - fromIndex / toIndex 는 "현재 시간 순 정렬" 기준 인덱스
   * - 재배치 후 전체 Day의 시간대를 다시 계산해서
   *   selectItemsOfDay(시간 오름차순)에 그대로 반영되도록 함
   */
  moveItemWithinDay: (
    dayId: string,
    fromIndex: number,
    toIndex: number
  ) => void;

  removeItem: (itemId: string) => void;

  recalcLinksForDay: (dayId: string, modeOverride?: TransportMode) => void;
  setLinkMetrics: (
    linkId: string,
    metrics: {
      distanceMeters?: number | null;
      durationSec?: number | null;
      cost?: number | null;
    }
  ) => void;

  /** 예시 트립 가져오기 (isSample 옵션 반영) */
  importSampleTrip: (
    templateId: TemplateId,
    options?: SampleGenOptions & { isSample?: boolean }
  ) => Promise<string>;

  /** 샘플 트립(또는 아무 트립)을 유저 트립으로 복제 */
  duplicateTripAsUser: (tripId: string) => string;

  /** 트립과 연쇄 엔티티 제거(장소는 참조 없는 것만 정리) */
  removeTrip: (tripId: string) => void;
}

// ────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────
function isoDateOnly(iso: string) {
  const d = parseISO(iso);
  const normalized = new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  );
  return formatISO(normalized, { representation: "date" });
}

function minutesClamp(m?: number) {
  if (m == null) return undefined;
  return Math.max(0, Math.min(24 * 60, Math.round(m)));
}

function toTravelMode(
  m: TransportMode
): "DRIVING" | "WALKING" | "TRANSIT" | "BICYCLING" {
  if (m === "walk") return "WALKING";
  if (m === "transit") return "TRANSIT";
  if (m === "bike") return "BICYCLING";
  return "DRIVING";
}

function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371e3;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s1 = Math.sin(dLat / 2);
  const s2 = Math.sin(dLng / 2);
  const aa =
    s1 * s1 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

function kindToItemType(k: ItemSeed["kind"]): ItemType {
  if (k === "meal") return "food";
  if (k === "activity") return "activity";
  if (k === "spot") return "spot";
  return "custom";
}

// ────────────────────────────────────────────────────────────
// store
// ────────────────────────────────────────────────────────────
export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      trips: {},
      days: {},
      items: {},
      links: {},
      places: {},
      currentTripId: null,

      createTrip: ({
        startDateISO,
        nights,
        currency,
        budgetTotal,
        transportDefault,
        baseHotel,
        isSample,
      }) => {
        const id = nanoid();
        const now = new Date().toISOString();
        const start = isoDateOnly(startDateISO);

        const trip: Trip = {
          id,
          startDateISO: start,
          nights: Math.max(1, nights),
          currency,
          budgetTotal: Math.max(0, budgetTotal),
          transportDefault,
          createdAt: now,
          updatedAt: now,
          isSample: !!isSample,
        };

        const nextState = { ...get() };
        nextState.trips[id] = trip;

        const daysToCreate = nights + 1;
        for (let i = 0; i < daysToCreate; i++) {
          const dayId = nanoid();
          const day: Day = {
            id: dayId,
            tripId: id,
            dateISO: isoDateOnly(formatISO(addDays(parseISO(start), i))),
            order: i + 1,
            budgetDaily: Math.floor(trip.budgetTotal / daysToCreate),
          };
          nextState.days[dayId] = day;
        }

        if (baseHotel) {
          const placeId = baseHotel.id ?? nanoid();
          const place: Place = {
            id: placeId,
            name: baseHotel.name,
            address: baseHotel.address,
            lat: baseHotel.lat ?? 0,
            lng: baseHotel.lng ?? 0,
            googlePlaceId: baseHotel.googlePlaceId,
            formattedAddress: baseHotel.formattedAddress,
            types: baseHotel.types,
            city: baseHotel.city,
            countryCode: baseHotel.countryCode,
            source: baseHotel.source ?? "google",
            spotId: baseHotel.spotId,
            poiId: baseHotel.poiId,
          };
          nextState.places[placeId] = place;
          nextState.trips[id].baseHotelId = placeId;
        }

        set({ ...nextState, currentTripId: id });
        return id;
      },

      setBudgetTotal: (tripId, budgetTotal) => {
        const st = get();
        const trip = st.trips[tripId];
        if (!trip) return;

        const t: Trip = {
          ...trip,
          budgetTotal: Math.max(0, budgetTotal),
          updatedAt: new Date().toISOString(),
        };
        const daysOfTrip = Object.values(st.days).filter(
          (d) => d.tripId === tripId
        );
        const perDay = Math.floor(
          t.budgetTotal / Math.max(1, daysOfTrip.length)
        );

        const daysPatched: EntityMap<Day> = { ...st.days };
        for (const d of daysOfTrip)
          daysPatched[d.id] = { ...d, budgetDaily: perDay };

        set({
          trips: { ...st.trips, [tripId]: t },
          days: daysPatched,
        });
      },

      setCurrency: (tripId, currency) => {
        const st = get();
        const trip = st.trips[tripId];
        if (!trip) return;
        set({
          trips: {
            ...st.trips,
            [tripId]: {
              ...trip,
              currency,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      },

      setTransportDefault: (tripId, mode) => {
        const st = get();
        const trip = st.trips[tripId];
        if (!trip) return;
        set({
          trips: {
            ...st.trips,
            [tripId]: {
              ...trip,
              transportDefault: mode,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      },

      setBaseHotel: (tripId, place) => {
        const st = get();
        const trip = st.trips[tripId];
        if (!trip) return;
        const placeId = place.id || nanoid();

        const existing = st.places[placeId];
        const merged: Place = existing
          ? {
              ...existing,
              ...place,
              id: placeId,
            }
          : {
              id: placeId,
              name: place.name,
              address: place.address,
              lat: place.lat ?? 0,
              lng: place.lng ?? 0,
              googlePlaceId: place.googlePlaceId,
              formattedAddress: place.formattedAddress,
              types: place.types,
              city: place.city,
              countryCode: place.countryCode,
              source: place.source ?? "google",
              spotId: place.spotId,
              poiId: place.poiId,
            };

        set({
          trips: {
            ...st.trips,
            [tripId]: {
              ...trip,
              baseHotelId: placeId,
              updatedAt: new Date().toISOString(),
            },
          },
          places: {
            ...st.places,
            [placeId]: merged,
          },
        });
      },

      upsertPlaceFromGoogle: (g) => {
        const st = get();

        // googlePlaceId 기준으로 기존 Place 탐색
        const existing = Object.values(st.places).find(
          (p) => p.googlePlaceId && p.googlePlaceId === g.googlePlaceId
        );

        if (existing) {
          const id = existing.id;
          const updated: Place = {
            ...existing,
            name: g.name ?? existing.name,
            address: g.address ?? existing.address,
            formattedAddress: g.formattedAddress ?? existing.formattedAddress,
            lat: g.lat ?? existing.lat,
            lng: g.lng ?? existing.lng,
            types: g.types ?? existing.types,
            city: g.city ?? existing.city,
            countryCode: g.countryCode ?? existing.countryCode,
            googlePlaceId: g.googlePlaceId ?? existing.googlePlaceId,
            source: existing.source ?? "google",
          };
          set({
            places: { ...st.places, [id]: updated },
          });
          return id;
        }

        const newId = nanoid();
        const place: Place = {
          id: newId,
          name: g.name,
          address: g.address,
          formattedAddress: g.formattedAddress,
          lat: g.lat,
          lng: g.lng,
          types: g.types,
          city: g.city,
          countryCode: g.countryCode,
          googlePlaceId: g.googlePlaceId,
          source: "google",
        };

        set({
          places: { ...st.places, [newId]: place },
        });

        return newId;
      },

      addDay: (tripId, dateISO, afterOrder) => {
        const st = get();
        const dayId = nanoid();
        const siblings = Object.values(st.days)
          .filter((d) => d.tripId === tripId)
          .sort((a, b) => a.order - b.order);

        let insertOrder = (siblings[siblings.length - 1]?.order || 0) + 1;
        if (afterOrder != null) {
          insertOrder = afterOrder + 1;
          const daysPatched: EntityMap<Day> = { ...st.days };
          for (const d of siblings)
            if (d.order > afterOrder)
              daysPatched[d.id] = {
                ...d,
                order: d.order + 1,
              };
          set({ days: daysPatched });
        }

        const day: Day = {
          id: dayId,
          tripId,
          dateISO: isoDateOnly(dateISO),
          order: insertOrder,
        };
        set((prev) => ({
          days: { ...prev.days, [dayId]: day },
        }));
        return dayId;
      },

      removeDay: (dayId) => {
        const st = get();
        const day = st.days[dayId];
        if (!day) return;

        const daysSameTrip = Object.values(st.days)
          .filter((d) => d.tripId === day.tripId && d.id !== dayId)
          .sort((a, b) => a.order - b.order);

        const itemsPatched = { ...st.items };
        const linksPatched = { ...st.links };

        for (const it of Object.values(st.items)) {
          if (it.dayId === dayId) {
            delete itemsPatched[it.id];
            for (const ln of Object.values(st.links)) {
              if (
                ln.tripId === it.tripId &&
                (ln.fromItemId === it.id || ln.toItemId === it.id)
              ) {
                delete linksPatched[ln.id];
              }
            }
          }
        }

        const daysPatched = { ...st.days };
        delete daysPatched[dayId];
        daysSameTrip.forEach((d, idx) => {
          daysPatched[d.id] = { ...d, order: idx + 1 };
        });

        set({
          days: daysPatched,
          items: itemsPatched,
          links: linksPatched,
        });
      },

      reorderDays: (tripId, orderedDayIds) => {
        const st = get();
        const daysPatched = { ...st.days };
        orderedDayIds.forEach((id, idx) => {
          const d = daysPatched[id];
          if (d && d.tripId === tripId)
            daysPatched[id] = { ...d, order: idx + 1 };
        });
        set({ days: daysPatched });
      },

      addItem: (input) => {
        const id = input.id ?? nanoid();
        const item: Item = {
          ...input,
          id,
          timeStartMin: minutesClamp(input.timeStartMin),
          timeEndMin: minutesClamp(input.timeEndMin),
        };
        set((prev) => ({
          items: { ...prev.items, [id]: item },
        }));
        get().recalcLinksForDay(item.dayId);
        return id;
      },

      updateItem: (itemId, patch) => {
        const st = get();
        const cur = st.items[itemId];
        if (!cur) return;

        const next: Item = {
          ...cur,
          ...patch,
          timeStartMin: minutesClamp(patch.timeStartMin ?? cur.timeStartMin),
          timeEndMin: minutesClamp(patch.timeEndMin ?? cur.timeEndMin),
        };

        set({
          items: { ...st.items, [itemId]: next },
        });
        get().recalcLinksForDay(next.dayId);
      },

      moveItemToDay: (itemId, toDayId, newIndex) => {
        const st = get();
        const cur = st.items[itemId];
        if (!cur) return;
        const fromDayId = cur.dayId;

        const itemsInTo = Object.values(st.items)
          .filter((i) => i.dayId === toDayId)
          .sort((a, b) => (a.timeStartMin ?? 0) - (b.timeStartMin ?? 0));

        const duration = Math.max(
          15,
          (cur.timeEndMin ?? 0) - (cur.timeStartMin ?? 0)
        );
        const toIdx = Math.max(
          0,
          Math.min(itemsInTo.length, newIndex ?? itemsInTo.length)
        );
        const prev = itemsInTo[toIdx - 1];
        const next = itemsInTo[toIdx];

        let newStart: number;
        if (prev && next) {
          const windowStart =
            prev.timeEndMin ?? (prev.timeStartMin ?? 9 * 60) + 60;
          const windowEnd = next.timeStartMin ?? (next.timeEndMin ?? 10 * 60);
          newStart = Math.max(0, Math.min(windowEnd - duration, windowStart));
        } else if (!prev && next) {
          newStart = Math.max(0, (next.timeStartMin ?? 9 * 60) - duration);
        } else if (prev && !next) {
          newStart = Math.max(0, prev.timeEndMin ?? 9 * 60);
        } else {
          newStart = cur.timeStartMin ?? 9 * 60;
        }

        const shifted: Item = {
          ...cur,
          dayId: toDayId,
          timeStartMin: newStart,
          timeEndMin: newStart + duration,
        };
        set({
          items: { ...st.items, [itemId]: shifted },
        });
        get().recalcLinksForDay(fromDayId);
        get().recalcLinksForDay(toDayId);
      },

      moveItemWithinDay: (dayId, fromIndex, toIndex) => {
        const st = get();
        const itemsInDay = Object.values(st.items)
          .filter((i) => i.dayId === dayId)
          .sort((a, b) => (a.timeStartMin ?? 0) - (b.timeStartMin ?? 0));

        if (itemsInDay.length === 0) return;

        const from = Math.max(
          0,
          Math.min(itemsInDay.length - 1, fromIndex)
        );
        const to = Math.max(0, Math.min(itemsInDay.length - 1, toIndex));
        if (from === to) return;

        const ordered = [...itemsInDay];
        const [moved] = ordered.splice(from, 1);
        ordered.splice(to, 0, moved);

        const itemsPatched: EntityMap<Item> = { ...st.items };

        // 기준 시작 시간: 첫 아이템의 시작시간(없으면 09:00)
        let cursor =
          ordered[0].timeStartMin != null
            ? ordered[0].timeStartMin
            : 9 * 60;

        for (const it of ordered) {
          const original = st.items[it.id];
          if (!original) continue;

          const rawDuration =
            (original.timeEndMin ?? 0) - (original.timeStartMin ?? 0);
          const duration = Math.max(15, rawDuration || 60);

          const start = cursor;
          const end = start + duration;

          itemsPatched[original.id] = {
            ...original,
            timeStartMin: start,
            timeEndMin: end,
          };

          cursor = end;
        }

        set({ items: itemsPatched });
        get().recalcLinksForDay(dayId);
      },

      removeItem: (itemId) => {
        const st = get();
        const cur = st.items[itemId];
        if (!cur) return;

        const linksPatched = { ...st.links };
        for (const ln of Object.values(st.links)) {
          if (
            ln.tripId === cur.tripId &&
            (ln.fromItemId === itemId || ln.toItemId === itemId)
          ) {
            delete linksPatched[ln.id];
          }
        }

        const itemsPatched = { ...st.items };
        delete itemsPatched[itemId];
        set({
          items: itemsPatched,
          links: linksPatched,
        });
        get().recalcLinksForDay(cur.dayId);
      },

      recalcLinksForDay: (dayId, modeOverride) => {
        const st0 = get();
        const day = st0.days[dayId];
        if (!day) return;
        const trip = st0.trips[day.tripId];
        if (!trip) return;

        const items = Object.values(st0.items)
          .filter((i) => i.dayId === dayId)
          .sort((a, b) => (a.timeStartMin ?? 0) - (b.timeStartMin ?? 0));

        // 기존 동일 Day 링크 제거
        const linksPatched = { ...st0.links };
        for (const ln of Object.values(linksPatched)) {
          const from = st0.items[ln.fromItemId];
          const to = st0.items[ln.toItemId];
          if (from?.dayId === dayId && to?.dayId === dayId)
            delete linksPatched[ln.id];
        }

        // 새 링크 생성
        const created: Array<{ id: string; from: Item; to: Item }> = [];
        for (let i = 0; i < items.length - 1; i++) {
          const from = items[i];
          const to = items[i + 1];
          const linkId = nanoid();
          linksPatched[linkId] = {
            id: linkId,
            tripId: trip.id,
            fromItemId: from.id,
            toItemId: to.id,
            mode: modeOverride ?? trip.transportDefault,
            distanceMeters: null,
            durationSec: null,
            cost: null,
          };
          created.push({ id: linkId, from, to });
        }

        set({ links: linksPatched });

        // 거리/시간 계산 (TTL 캐시/디듀핑 이용)
        queueMicrotask(async () => {
          const st = get();
          if (created.length === 0) return;
          const mode = toTravelMode(modeOverride ?? trip.transportDefault);

          const coords = (it: Item) => {
            const p = it.placeId ? st.places[it.placeId] : undefined;
            return p && typeof p.lat === "number" && typeof p.lng === "number"
              ? { lat: p.lat, lng: p.lng }
              : null;
          };

          const linkIds: string[] = [];
          const pairs: Array<{
            origin: { lat: number; lng: number };
            destination: { lat: number; lng: number };
          }> = [];
          for (const c of created) {
            const a = coords(c.from);
            const b = coords(c.to);
            if (!a || !b) continue;
            linkIds.push(c.id);
            pairs.push({ origin: a, destination: b });
          }
          if (pairs.length === 0) return;

          try {
            const metrics = await getMatrix(pairs, { mode });
            metrics.forEach((m, i) => {
              const linkId = linkIds[i];
              if (!linkId || !m) return;
              get().setLinkMetrics(linkId, {
                distanceMeters: m.distanceMeters ?? null,
                durationSec: m.durationSec ?? null,
              });
            });
          } catch {
            // Google 실패 시 구면거리 기반 폴백
            const speed =
              mode === "WALKING"
                ? 1.4
                : mode === "BICYCLING"
                ? 4.5
                : mode === "TRANSIT"
                ? 8.3
                : 13.9;
            pairs.forEach((p, i) => {
              const d = haversineMeters(p.origin, p.destination);
              const t = Math.round(d / speed);
              const linkId = linkIds[i];
              if (!linkId) return;
              get().setLinkMetrics(linkId, {
                distanceMeters: Math.round(d),
                durationSec: t,
              });
            });
          }
        });
      },

      setLinkMetrics: (linkId, metrics) => {
        const st = get();
        const ln = st.links[linkId];
        if (!ln) return;
        set({
          links: {
            ...st.links,
            [linkId]: { ...ln, ...metrics },
          },
        });
      },

      importSampleTrip: async (templateId, options) => {
        const template = getTemplate(templateId);
        const startISO =
          options?.startDate ??
          formatISO(addDays(new Date(), 7), {
            representation: "date",
          });
        const nights = options?.nights ?? template.meta.nights;
        const currency = options?.currency ?? template.meta.currency;
        const isSample = options?.isSample ?? false;

        const tripId = get().createTrip({
          startDateISO: startISO,
          nights,
          currency,
          budgetTotal: template.meta.plannedBudgetVnd,
          transportDefault: template.meta.defaultMode,
          baseHotel: template.base
            ? {
                name: template.base.name,
                lat: template.base.location.lat,
                lng: template.base.location.lng,
              }
            : undefined,
          isSample,
        });

        const st1 = get();
        const dayList = Object.values(st1.days)
          .filter((d) => d.tripId === tripId)
          .sort((a, b) => a.order - b.order);

        const placesToInsert: EntityMap<Place> = {};
        const itemsToInsert: EntityMap<Item> = {};

        template.days.forEach((tplDay, dayIdx) => {
          const day = dayList[dayIdx];
          if (!day) return;
          tplDay.items.forEach((seed: ItemSeed) => {
            const placeId = nanoid();
            placesToInsert[placeId] = {
              id: placeId,
              name: seed.name,
              lat: seed.location.lat,
              lng: seed.location.lng,
              address: undefined,
              googlePlaceId: undefined,
              formattedAddress: undefined,
              types: undefined,
              city: undefined,
              countryCode: undefined,
              source: "spot",
              spotId: undefined,
              poiId: undefined,
            };
            const itemId = nanoid();
            itemsToInsert[itemId] = {
              id: itemId,
              tripId,
              dayId: day.id,
              type: kindToItemType(seed.kind),
              title: seed.name,
              placeId,
              timeStartMin: minutesClamp(seed.timeStartMin),
              timeEndMin: minutesClamp(seed.timeEndMin),
              cost: seed.costVnd,
              note: seed.note,
            };
          });
        });

        set((prev) => ({
          places: {
            ...prev.places,
            ...placesToInsert,
          },
          items: { ...prev.items, ...itemsToInsert },
          currentTripId: tripId,
        }));

        get().setCurrency(tripId, currency);
        get().setBudgetTotal(tripId, template.meta.plannedBudgetVnd);
        get().setTransportDefault(tripId, template.meta.defaultMode);
        dayList.forEach((d) =>
          get().recalcLinksForDay(d.id, template.meta.defaultMode)
        );

        // 첫 Day로 포커스 이동
        const ui = usePlanUIStore.getState();
        ui.setCurrentDayId?.(dayList[0]?.id ?? null);

        // 안내 토스트(선택)
        (window as any)?.toast?.success?.(
          "샘플 일정이 생성됐어요. 언제든 수정/저장 가능해요."
        );

        return tripId;
      },

      /** 샘플 트립을 유저 트립으로 복사하는 메서드 */
      duplicateTripAsUser: (tripId: string) => {
        const st = get();
        const src = st.trips[tripId];
        if (!src) return "";

        const now = new Date().toISOString();
        const newTripId = nanoid();

        const newTrip: Trip = {
          ...src,
          id: newTripId,
          createdAt: now,
          updatedAt: now,
          isSample: false,
        };

        const tripsPatched: EntityMap<Trip> = {
          ...st.trips,
          [newTripId]: newTrip,
        };

        const daysPatched: EntityMap<Day> = { ...st.days };
        const itemsPatched: EntityMap<Item> = { ...st.items };
        const linksPatched: EntityMap<Link> = { ...st.links };

        const dayIdMap = new Map<string, string>();
        const itemIdMap = new Map<string, string>();

        // Day 복사
        const srcDays = Object.values(st.days)
          .filter((d) => d.tripId === tripId)
          .sort((a, b) => a.order - b.order);
        for (const d of srcDays) {
          const newDayId = nanoid();
          dayIdMap.set(d.id, newDayId);
          daysPatched[newDayId] = {
            ...d,
            id: newDayId,
            tripId: newTripId,
          };
        }

        // Item 복사
        const srcItems = Object.values(st.items).filter(
          (i) => i.tripId === tripId
        );
        for (const it of srcItems) {
          const newItemId = nanoid();
          itemIdMap.set(it.id, newItemId);
          itemsPatched[newItemId] = {
            ...it,
            id: newItemId,
            tripId: newTripId,
            dayId: dayIdMap.get(it.dayId) ?? it.dayId,
          };
        }

        // Link 복사 (새 Item id 기준으로 매핑)
        const srcLinks = Object.values(st.links).filter(
          (ln) => ln.tripId === tripId
        );
        for (const ln of srcLinks) {
          const fromNew = itemIdMap.get(ln.fromItemId);
          const toNew = itemIdMap.get(ln.toItemId);
          if (!fromNew || !toNew) continue;
          const newLinkId = nanoid();
          linksPatched[newLinkId] = {
            ...ln,
            id: newLinkId,
            tripId: newTripId,
            fromItemId: fromNew,
            toItemId: toNew,
          };
        }

        // places 는 공유(복사 X) — 삭제 시 참조 카운트 기반으로 정리
        set({
          trips: tripsPatched,
          days: daysPatched,
          items: itemsPatched,
          links: linksPatched,
          places: st.places,
          currentTripId: newTripId,
        });

        // 새 트립의 링크 재계산
        const newDayIds = Array.from(dayIdMap.values());
        newDayIds.forEach((dId) => get().recalcLinksForDay(dId));

        // 원본이 샘플이면 정리 (store/UI)
        if (src.isSample) {
          get().removeTrip(tripId);
        }

        // 새 트립의 첫 Day 를 현재 Day로 선택
        const st2 = get();
        const newDaysForTrip = Object.values(st2.days)
          .filter((d) => d.tripId === newTripId)
          .sort((a, b) => a.order - b.order);
        const ui = usePlanUIStore.getState();
        ui.setCurrentDayId?.(newDaysForTrip[0]?.id ?? null);
        ui.setLastSampleTripId?.(null);

        (window as any)?.toast?.success?.(
          "샘플 일정이 내 일정으로 복사되었어요."
        );

        return newTripId;
      },

      removeTrip: (tripId) => {
        const st = get();
        if (!st.trips[tripId]) return;

        // 1) days/items/links 제거
        const daysPatched = { ...st.days };
        const itemsPatched = { ...st.items };
        const linksPatched = { ...st.links };

        const dayIds = Object.values(st.days)
          .filter((d) => d.tripId === tripId)
          .map((d) => d.id);
        for (const dId of dayIds) delete daysPatched[dId];

        const itemIds = Object.values(st.items)
          .filter((i) => i.tripId === tripId)
          .map((i) => i.id);
        for (const itId of itemIds) delete itemsPatched[itId];

        for (const ln of Object.values(st.links)) {
          if (ln.tripId === tripId) delete linksPatched[ln.id];
        }

        // 2) trip 삭제
        const tripsPatched = { ...st.trips };
        const removedTrip = tripsPatched[tripId];
        delete tripsPatched[tripId];

        // 3) 참조 없는 place 정리 (남은 items/트립에서 참조되는 것만 유지)
        const keepPlaceIds = new Set<string>();
        for (const it of Object.values(itemsPatched))
          if (it.placeId) keepPlaceIds.add(it.placeId);
        for (const tr of Object.values(tripsPatched))
          if (tr.baseHotelId) keepPlaceIds.add(tr.baseHotelId);

        const placesPatched: EntityMap<Place> = {};
        for (const [pid, p] of Object.entries(st.places)) {
          if (keepPlaceIds.has(pid)) placesPatched[pid] = p;
        }

        const currentTripId =
          st.currentTripId === tripId ? null : st.currentTripId;

        set({
          trips: tripsPatched,
          days: daysPatched,
          items: itemsPatched,
          links: linksPatched,
          places: placesPatched,
          currentTripId,
        });

        // 샘플로 열었던 거라면 UI 마커도 비우기
        if (removedTrip?.isSample) {
          const ui = usePlanUIStore.getState();
          ui.setLastSampleTripId?.(null);
          ui.setCurrentDayId?.(null);
        }
      },
    }),
    {
      name: "plan-store",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      /**
       * persist 저장 시: 샘플 트립과 그에 속한 day/item/link는 저장에서 제외
       * 새로고침/복귀 시 샘플이 남지 않도록 한다.
       */
      partialize: (state) => {
        // 남겨둘 trip id 집합 (샘플 제외)
        const keepTripIds = new Set(
          Object.values(state.trips)
            .filter((t) => !t.isSample)
            .map((t) => t.id)
        );

        // days/items/links 필터
        const days: EntityMap<Day> = {};
        const items: EntityMap<Item> = {};
        const links: EntityMap<Link> = {};
        for (const d of Object.values(state.days))
          if (keepTripIds.has(d.tripId)) days[d.id] = d;
        for (const it of Object.values(state.items))
          if (keepTripIds.has(it.tripId)) items[it.id] = it;
        for (const ln of Object.values(state.links))
          if (keepTripIds.has(ln.tripId)) links[ln.id] = ln;

        // places — 남은 item들의 placeId + 남은 trip의 baseHotelId만 유지
        const keepPlaceIds = new Set<string>();
        for (const it of Object.values(items))
          if (it.placeId) keepPlaceIds.add(it.placeId);
        for (const t of Object.values(state.trips))
          if (!t.isSample && t.baseHotelId)
            keepPlaceIds.add(t.baseHotelId);

        const places: EntityMap<Place> = {};
        for (const [pid, p] of Object.entries(state.places))
          if (keepPlaceIds.has(pid)) places[pid] = p;

        // trips — 샘플 제외하여 저장
        const trips: EntityMap<Trip> = {};
        for (const t of Object.values(state.trips))
          if (!t.isSample) trips[t.id] = t;

        return { trips, days, items, links, places };
      },
      migrate: (persisted: any, fromVersion) => {
        // v2 → v3: 이전에 저장돼 있던 currentTripId 정리(없어도 무방하지만 안전하게 리셋)
        if (fromVersion < 3 && persisted) {
          const { currentTripId, ...rest } = persisted;
          return { ...rest, currentTripId: null };
        }
        return persisted as any;
      },
    }
  )
);

// ────────────────────────────────────────────────────────────
// Selectors
// ────────────────────────────────────────────────────────────
export const selectCurrentTrip = (s: PlanState) =>
  s.currentTripId ? s.trips[s.currentTripId] : undefined;

export const selectDaysOfTrip = (s: PlanState, tripId?: string): Day[] => {
  const id = tripId ?? s.currentTripId ?? "";
  return Object.values(s.days)
    .filter((d) => d.tripId === id)
    .sort((a, b) => a.order - b.order);
};
export const selectDaysOfTripIds = (s: PlanState, tripId?: string): string[] =>
  selectDaysOfTrip(s, tripId).map((d) => d.id);

export const selectItemsOfDay = (s: PlanState, dayId: string): Item[] =>
  Object.values(s.items)
    .filter((i) => i.dayId === dayId)
    .sort((a, b) => (a.timeStartMin ?? 0) - (b.timeStartMin ?? 0));

export const selectItemIdsOfDay = (s: PlanState, dayId: string): string[] =>
  selectItemsOfDay(s, dayId).map((i) => i.id);

// 기존 임시 별칭 (호환)
export const itemsArrayForDay = (s: PlanState, dayId: string) =>
  selectItemsOfDay(s, dayId);

export const selectConflictsOfDay = (
  s: PlanState,
  dayId: string
): Array<{ a: Item; b: Item }> => {
  const arr = selectItemsOfDay(s, dayId);
  const res: Array<{ a: Item; b: Item }> = [];
  for (let i = 0; i < arr.length - 1; i++) {
    const a = arr[i];
    const b = arr[i + 1];
    if ((a.timeEndMin ?? 0) > (b.timeStartMin ?? 0)) res.push({ a, b });
  }
  return res;
};
