// apps/web/src/features/plan/stores/plan.store.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import { addDays, parseISO, formatISO } from "date-fns";

import type {
  Trip,
  Day,
  Item,
  Link,
  Place,
  LinkMetrics,
  EntityMap,
  TransportMode,
  TripTemplateMeta,
} from "@/types/plan";
import type {
  TemplateId,
  ItemSeed,
  SampleGenOptions,
} from "@/types/plan.template";

import { getTemplate } from "@/features/plan/data/templates";

import {
  buildAdjacencyArgs,
  diagonalSegments,
  type Mode as DistanceMode,
} from "@/hooks/useDistanceMatrix";
import { getMatrix } from "@/services/distance";

// ─────────────────────────────────────────────────────────────
// Distance Matrix
// ─────────────────────────────────────────────────────────────

export type DistanceMatrixState = {
  mode: DistanceMode | null;
  loading: boolean;
  error: string | null;
  metricsByKey: Record<string, LinkMetrics>;
};

// Distance matrix 초기 상태 생성
export function createEmptyDistanceMatrixState(): DistanceMatrixState {
  return {
    mode: null,
    loading: false,
    error: null,
    metricsByKey: {},
  };
}

// ─────────────────────────────────────────────────────────────
// 상태 타입 정의
// ─────────────────────────────────────────────────────────────

// Trip 생성 시 사용하는 입력 타입
export type CreateTripInput = {
  title: string;
  startDateISO: string; // "YYYY-MM-DD"
  nights: number;
  templateMeta?: TripTemplateMeta | null;
  isSample?: boolean;
  baseHotel?: {
    name: string;
    lat: number;
    lng: number;
    address?: string;
  } | null;
};

// AddItem 입력 타입
export type AddItemInput = {
  tripId: string;
  dayId: string;
  type?: Item["type"];
  title?: string;
  note?: string;
  startTime?: string | null;
  endTime?: string | null;
  cost?: number | null;
  transportMode?: TransportMode | null;
  placeId?: string | null;
  googlePlace?: {
    placeId: string;
    name: string;
    address?: string;
    lat: number;
    lng: number;
  } | null;
  // [UX 개선] 삽입 위치 지정 (선택된 아이템 뒤에 추가하기 위함)
  insertAfterIndex?: number;
};

export interface PlanState {
  trips: EntityMap<Trip>;
  days: EntityMap<Day>;
  items: EntityMap<Item>;
  links: EntityMap<Link>;
  places: EntityMap<Place>;

  currentTripId: string | null;
  lastSampleTripId: string | null;

  distanceMatrix: DistanceMatrixState;
}

// Store interface
export interface PlanStore extends PlanState {
  // Trip
  createTrip(input: CreateTripInput): string;
  setCurrentTripId(tripId: string | null): void;
  setTripTitle(tripId: string, title: string): void;
  setTripDates(tripId: string, startDateISO: string, nights: number): void;
  setTripBudget(tripId: string, budgetTotal: number | null): void;
  setTripCurrency(tripId: string, currency: string): void;
  setTripTransportDefault(tripId: string, mode: TransportMode): void;
  setTripBaseHotel(
    tripId: string,
    baseHotel:
      | {
          name: string;
          lat: number;
          lng: number;
          address?: string;
        }
      | null,
  ): void;

  // Day
  addDay(tripId: string, dateISO: string): string;
  removeDay(dayId: string): void;

  // Item
  addItem(input: AddItemInput): string;
  updateItem(itemId: string, patch: Partial<Item>): void;
  removeItem(itemId: string): void;

  // Link
  addLink(
    fromItemId: string,
    toItemId: string,
    mode: TransportMode,
  ): string | null;
  updateLink(linkId: string, patch: Partial<Link>): void;
  removeLink(linkId: string): void;

  // Place
  upsertPlace(place: Place): string;
  removePlace(placeId: string): void;

  // 샘플 트립
  importSampleTrip(options: SampleGenOptions): string;
  setLastSampleTripId(tripId: string | null): void;

  // Trip 삭제/초기화
  deleteTrip(tripId: string): void;
  resetAllTrips(): void;

  // Distance Matrix
  requestDistanceMatrixForTrip(
    tripId: string,
    mode: DistanceMode,
  ): Promise<void> | void;
  clearDistanceMatrix(): void;
}

// ─────────────────────────────────────────────────────────────
// 셀렉터들
// ─────────────────────────────────────────────────────────────

export function selectCurrentTrip(state: PlanState): Trip | null {
  const { currentTripId, trips } = state;
  if (!currentTripId) return null;
  return trips[currentTripId] ?? null;
}

export function selectDaysOfTrip(
  state: PlanState,
  tripId?: string | null,
): Day[] {
  const effectiveTripId = tripId ?? state.currentTripId;
  if (!effectiveTripId) return [];

  const days = Object.values(state.days).filter(
    (d) => d.tripId === effectiveTripId,
  );

  return days.sort((a, b) => {
    const ao = (a as any).order;
    const bo = (b as any).order;
    if (ao != null && bo != null) return ao - bo;
    return a.dateISO.localeCompare(b.dateISO);
  });
}

export function selectItemsOfDay(
  state: PlanState,
  dayId?: string | null,
): Item[] {
  if (!dayId) return [];
  const day = state.days[dayId];
  if (!day) return [];

  const items = day.itemIds
    .map((id) => state.items[id])
    .filter((it): it is Item => !!it);

  return items;
}

// Day 단위 일정 충돌(겹치는 일정 등) 셀렉터 (현재는 빈 배열 리턴)
export function selectConflictsOfDay(
  state: PlanState,
  dayId?: string | null,
): any[] {
  if (!dayId) return [];
  const day = state.days[dayId];
  if (!day) return [];
  return [];
}

// ─────────────────────────────────────────────────────────────
// 내부 유틸 함수
// ─────────────────────────────────────────────────────────────

function formatDateOnly(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatISO(d, { representation: "date" });
}

// minutes → "HH:mm"
function minutesToTimeString(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Trip 생성 시 Day들 생성
function createDaysForTrip(
  tripId: string,
  startDateISO: string,
  nights: number,
): { dayIds: string[]; days: EntityMap<Day> } {
  const dayIds: string[] = [];
  const days: EntityMap<Day> = {};
  const base = parseISO(startDateISO);

  // nights 기준으로 n박 → n+1일
  for (let i = 0; i <= nights; i += 1) {
    const id = nanoid();
    const date = addDays(base, i);
    const dateISO = formatDateOnly(date);

    dayIds.push(id);
    days[id] = {
      id,
      tripId,
      dateISO,
      itemIds: [],
      order: i,
    } as Day;
  }

  return { dayIds, days };
}

// ─────────────────────────────────────────────────────────────
// 초기 상태
// ─────────────────────────────────────────────────────────────

const initialState: PlanState = {
  trips: {},
  days: {},
  items: {},
  links: {},
  places: {},
  currentTripId: null,
  lastSampleTripId: null,
  distanceMatrix: createEmptyDistanceMatrixState(),
};

// ─────────────────────────────────────────────────────────────
// Store 구현
// ─────────────────────────────────────────────────────────────

export const usePlanStore = create<PlanStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ─────────────────────────────────────────────────────
      // Trip 관련
      // ─────────────────────────────────────────────────────

      createTrip: (input) => {
        const id = nanoid();
        const now = new Date().toISOString();

        const startDateISO = formatDateOnly(input.startDateISO);
        const nights = Math.max(1, input.nights);

        const { dayIds, days } = createDaysForTrip(
          id,
          startDateISO,
          nights,
        );

        const nextTrips: EntityMap<Trip> = {
          ...get().trips,
          [id]: {
            id,
            title: input.title,
            startDateISO,
            nights,
            dayIds,
            createdAt: now,
            updatedAt: now,
            budgetTotal: null,
            currency: "VND",
            transportDefault: "car",
            baseHotelPlaceId: null,
            templateMeta: input.templateMeta ?? null,
            isSample: input.isSample ?? false,
          } as Trip,
        };

        set((prev) => ({
          ...prev,
          trips: nextTrips,
          days: {
            ...prev.days,
            ...days,
            currentTripId: id,
          },
          currentTripId: id,
        }));

        return id;
      },

      setCurrentTripId: (tripId) => {
        set((prev) => ({
          ...prev,
          currentTripId: tripId,
        }));
      },

      setTripTitle: (tripId, title) => {
        set((prev) => {
          const trip = prev.trips[tripId];
          if (!trip) return prev;
          return {
            ...prev,
            trips: {
              ...prev.trips,
              [tripId]: {
                ...trip,
                title,
                updatedAt: new Date().toISOString(),
              } as Trip,
            },
          };
        });
      },

      setTripDates: (tripId, startDateISO, nights) => {
        set((prev) => {
          const trip = prev.trips[tripId];
          if (!trip) return prev;

          const newDayIds: string[] = [];
          const daysPatched: EntityMap<Day> = { ...prev.days };

          for (let i = 0; i <= nights; i += 1) {
            const dateISO = formatISO(addDays(parseISO(startDateISO), i), {
              representation: "date",
            });

            let dayId = trip.dayIds[i];
            if (!dayId) {
              dayId = nanoid();
            }

            newDayIds.push(dayId);

            daysPatched[dayId] = {
              ...(daysPatched[dayId] ?? {
                id: dayId,
                tripId,
                itemIds: [],
              }),
              dateISO,
              order: i,
            } as Day;
          }

          const removedDayIds = trip.dayIds.filter(
            (dayId) => !newDayIds.includes(dayId),
          );
          removedDayIds.forEach((dayId) => {
            delete daysPatched[dayId];
          });

          return {
            ...prev,
            trips: {
              ...prev.trips,
              [tripId]: {
                ...trip,
                startDateISO,
                nights,
                dayIds: newDayIds,
                updatedAt: new Date().toISOString(),
              } as Trip,
            },
            days: daysPatched,
          };
        });
      },

      setTripBudget: (tripId, budgetTotal) => {
        set((prev) => {
          const trip = prev.trips[tripId];
          if (!trip) return prev;
          return {
            ...prev,
            trips: {
              ...prev.trips,
              [tripId]: {
                ...trip,
                budgetTotal,
                updatedAt: new Date().toISOString(),
              } as Trip,
            },
          };
        });
      },

      setTripCurrency: (tripId, currency) => {
        set((prev) => {
          const trip = prev.trips[tripId];
          if (!trip) return prev;
          return {
            ...prev,
            trips: {
              ...prev.trips,
              [tripId]: {
                ...trip,
                currency,
                updatedAt: new Date().toISOString(),
              } as Trip,
            },
          };
        });
      },

      setTripTransportDefault: (tripId, mode) => {
        set((prev) => {
          const trip = prev.trips[tripId];
          if (!trip) return prev;
          return {
            ...prev,
            trips: {
              ...prev.trips,
              [tripId]: {
                ...trip,
                transportDefault: mode,
                updatedAt: new Date().toISOString(),
              } as Trip,
            },
          };
        });
      },

      setTripBaseHotel: (tripId, baseHotel) => {
        set((prev) => {
          const trip = prev.trips[tripId];
          if (!trip) return prev;

          let placesPatched: EntityMap<Place> = { ...prev.places };
          let baseHotelPlaceId = trip.baseHotelPlaceId ?? null;

          if (baseHotel) {
            if (!baseHotelPlaceId) {
              baseHotelPlaceId = nanoid();
            }

            placesPatched = {
              ...placesPatched,
              [baseHotelPlaceId]: {
                id: baseHotelPlaceId,
                name: baseHotel.name,
                lat: baseHotel.lat,
                lng: baseHotel.lng,
                address: baseHotel.address ?? "",
                city: null,
                countryCode: null,
                formattedAddress: baseHotel.address ?? "",
                types: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                source: "user",
              } as Place,
            };
          } else if (baseHotelPlaceId) {
            // 호텔 제거
            const { [baseHotelPlaceId]: _removed, ...restPlaces } =
              placesPatched;
            placesPatched = restPlaces;
            baseHotelPlaceId = null;
          }

          return {
            ...prev,
            trips: {
              ...prev.trips,
              [tripId]: {
                ...trip,
                baseHotelPlaceId,
                updatedAt: new Date().toISOString(),
              } as Trip,
            },
            places: placesPatched,
          };
        });
      },

      // Day
      addDay: (tripId, dateISO) => {
        const id = nanoid();
        set((prev) => {
          const trip = prev.trips[tripId];
          if (!trip) return prev;

          const order = (trip.dayIds.length ?? 0) + 1;

          return {
            ...prev,
            trips: {
              ...prev.trips,
              [tripId]: {
                ...trip,
                nights: trip.nights + 1,
                dayIds: [...trip.dayIds, id],
                updatedAt: new Date().toISOString(),
              } as Trip,
            },
            days: {
              ...prev.days,
              [id]: {
                id,
                tripId,
                dateISO,
                itemIds: [],
                order,
              } as Day,
            },
          };
        });
        return id;
      },

      removeDay: (dayId) => {
        set((prev) => {
          const day = prev.days[dayId];
          if (!day) return prev;

          const trip = prev.trips[day.tripId];
          if (!trip) return prev;

          const tripsPatched: EntityMap<Trip> = {
            ...prev.trips,
            [trip.id]: {
              ...trip,
              nights: Math.max(1, trip.nights - 1),
              dayIds: trip.dayIds.filter((id) => id !== dayId),
              updatedAt: new Date().toISOString(),
            } as Trip,
          };

          const { [dayId]: _removed, ...daysPatched } = prev.days;

          const itemsPatched: EntityMap<Item> = { ...prev.items };
          day.itemIds.forEach((itemId) => {
            delete itemsPatched[itemId];
          });

          return {
            ...prev,
            trips: tripsPatched,
            days: daysPatched,
            items: itemsPatched,
          };
        });
      },

      // Item
      addItem: (input) => {
        const id = nanoid();

        set((prev) => {
          const trip = prev.trips[input.tripId];
          const day = prev.days[input.dayId];
          if (!trip || !day) return prev;

          const now = new Date().toISOString();
          const placesPatched: EntityMap<Place> = { ...prev.places };

          let placeId = input.placeId ?? null;
          if (!placeId && input.googlePlace) {
            const gp = input.googlePlace;
            const newPlaceId = nanoid();
            placesPatched[newPlaceId] = {
              id: newPlaceId,
              name: gp.name,
              lat: gp.lat,
              lng: gp.lng,
              address: gp.address ?? "",
              formattedAddress: gp.address ?? "",
              city: null,
              countryCode: null,
              types: [],
              createdAt: now,
              updatedAt: now,
              source: "user",
              googlePlaceId: gp.placeId,
            } as Place;
            placeId = newPlaceId;
          }

          const newItem: Item = {
            id,
            tripId: input.tripId,
            dayId: input.dayId,
            type: input.type ?? "activity",
            title: input.title ?? "",
            note: input.note ?? "",
            startTime: input.startTime ?? null,
            endTime: input.endTime ?? null,
            cost: input.cost ?? null,
            transportMode:
              input.transportMode ?? trip.transportDefault ?? "car",
            placeId,
            createdAt: now,
            updatedAt: now,
          } as Item;

          // [UX 개선] 위치 지정 삽입 로직
          let nextItemIds = [...day.itemIds];
          if (
            typeof input.insertAfterIndex === "number" &&
            input.insertAfterIndex >= 0 &&
            input.insertAfterIndex < nextItemIds.length
          ) {
            // 지정된 인덱스 바로 뒤에 삽입
            nextItemIds.splice(input.insertAfterIndex + 1, 0, id);
          } else {
            // 기존처럼 맨 뒤에 추가
            nextItemIds.push(id);
          }

          return {
            ...prev,
            places: placesPatched,
            items: {
              ...prev.items,
              [id]: newItem,
            },
            days: {
              ...prev.days,
              [input.dayId]: {
                ...day,
                itemIds: nextItemIds,
              } as Day,
            },
          };
        });

        return id;
      },

      updateItem: (itemId, patch) => {
        set((prev) => {
          const item = prev.items[itemId];
          if (!item) return prev;

          const now = new Date().toISOString();
          const updated: Item = {
            ...item,
            ...patch,
            updatedAt: now,
          } as Item;

          // dayId 변경 시 day.itemIds 이동 처리
          let daysPatched: EntityMap<Day> = { ...prev.days };
          if (patch.dayId && patch.dayId !== item.dayId) {
            const oldDay = prev.days[item.dayId];
            const newDay = prev.days[patch.dayId];
            if (oldDay) {
              daysPatched[oldDay.id] = {
                ...oldDay,
                itemIds: oldDay.itemIds.filter((id) => id !== itemId),
              } as Day;
            }
            if (newDay) {
              daysPatched[newDay.id] = {
                ...newDay,
                itemIds: [...newDay.itemIds, itemId],
              } as Day;
            }
          }

          return {
            ...prev,
            items: {
              ...prev.items,
              [itemId]: updated,
            },
            days: daysPatched,
          };
        });
      },

      removeItem: (itemId) => {
        set((prev) => {
          const item = prev.items[itemId];
          if (!item) return prev;

          const day = prev.days[item.dayId];
          const itemsPatched: EntityMap<Item> = { ...prev.items };
          delete itemsPatched[itemId];

          const daysPatched: EntityMap<Day> = { ...prev.days };
          if (day) {
            daysPatched[day.id] = {
              ...day,
              itemIds: day.itemIds.filter((id) => id !== itemId),
            } as Day;
          }

          const linksPatched: EntityMap<Link> = { ...prev.links };
          Object.entries(linksPatched).forEach(([linkId, link]) => {
            if (
              link.fromItemId === itemId ||
              link.toItemId === itemId
            ) {
              delete linksPatched[linkId];
            }
          });

          return {
            ...prev,
            items: itemsPatched,
            days: daysPatched,
            links: linksPatched,
          };
        });
      },

      // Link
      addLink: (fromItemId, toItemId, mode) => {
        const fromItem = get().items[fromItemId];
        const toItem = get().items[toItemId];
        if (!fromItem || !toItem || fromItem.tripId !== toItem.tripId) {
          return null;
        }

        const id = nanoid();
        set((prev) => ({
          ...prev,
          links: {
            ...prev.links,
            [id]: {
              id,
              tripId: fromItem.tripId,
              fromItemId,
              toItemId,
              mode,
            } as Link,
          },
        }));
        return id;
      },

      updateLink: (linkId, patch) => {
        set((prev) => {
          const link = prev.links[linkId];
          if (!link) return prev;
          return {
            ...prev,
            links: {
              ...prev.links,
              [linkId]: {
                ...link,
                ...patch,
              } as Link,
            },
          };
        });
      },

      removeLink: (linkId) => {
        set((prev) => {
          if (!prev.links[linkId]) return prev;
          const { [linkId]: _removed, ...rest } = prev.links;
          return {
            ...prev,
            links: rest,
          };
        });
      },

      // Place
      upsertPlace: (place) => {
        set((prev) => ({
          ...prev,
          places: {
            ...prev.places,
            [place.id]: place,
          },
        }));
        return place.id;
      },

      removePlace: (placeId) => {
        set((prev) => {
          const { [placeId]: _removed, ...rest } = prev.places;
          return {
            ...prev,
            places: rest,
          };
        });
      },

      // ─────────────────────────────────────────────────────
      // [핵심 수정] importSampleTrip
      // : 템플릿의 days 배열을 순회하며 정확한 Day Index에 아이템을 배치합니다.
      // ─────────────────────────────────────────────────────
      importSampleTrip: (options) => {
        const { templateId, startDateISO, isSample, baseHotel } =
          options;

        const template = getTemplate(templateId as TemplateId);
        if (!template) {
          // 템플릿이 없으면 그냥 빈 Trip 생성
          return get().createTrip({
            title: "샘플 여행",
            startDateISO: startDateISO ?? formatDateOnly(new Date()),
            nights: 2,
            templateMeta: null,
            isSample: isSample ?? true,
            baseHotel: baseHotel ?? null,
          });
        }

        const now = new Date().toISOString();
        const tripId = nanoid();

        // 템플릿 meta.nights 우선, 없으면 days 배열 길이 - 1 (n박 n+1일)
        const nights =
          template.meta.nights ??
          (template.days?.length ? template.days.length - 1 : 2);

        const start =
          startDateISO ??
          template.meta.label ?? // fallback if meta has it
          formatDateOnly(new Date());

        // Day 생성
        const { dayIds, days } = createDaysForTrip(tripId, start, nights);

        const items: EntityMap<Item> = {};
        const places: EntityMap<Place> = {};

        // [수정됨] 1차원으로 합치지 않고, 템플릿의 각 날짜(days)를 순회하며 처리
        if (Array.isArray(template.days)) {
          template.days.forEach((tplDay, index) => {
            // dayIds 범위 내에서 매칭 (일정이 템플릿보다 짧으면 마지막 날에 붙임)
            const targetDayId = dayIds[Math.min(index, dayIds.length - 1)];
            const dayEntity = days[targetDayId];
            if (!dayEntity || !tplDay.items) return;

            tplDay.items.forEach((seed: any) => {
              const itemId = nanoid();
              let placeId: string | null = null;

              // 위치 정보 처리
              const loc = seed.place ?? seed.location ?? null;
              if (
                loc &&
                typeof loc.lat === "number" &&
                typeof loc.lng === "number" &&
                !Number.isNaN(loc.lat) &&
                !Number.isNaN(loc.lng)
              ) {
                const placeIdInner = nanoid();
                places[placeIdInner] = {
                  id: placeIdInner,
                  name:
                    seed.place?.name ??
                    seed.name ??
                    seed.title ??
                    "이름 없는 장소",
                  lat: loc.lat,
                  lng: loc.lng,
                  address: seed.place?.address ?? "",
                  formattedAddress: seed.place?.address ?? "",
                  city: seed.place?.city ?? null,
                  countryCode: seed.place?.countryCode ?? null,
                  types: seed.place?.types ?? [],
                  createdAt: now,
                  updatedAt: now,
                  source: "template",
                  googlePlaceId: seed.place?.googlePlaceId,
                } as Place;
                placeId = placeIdInner;
              }

              const title =
                seed.title ??
                seed.name ??
                (seed.place && seed.place.name) ??
                "일정";

              // 시간 처리
              let startTime: string | null = null;
              if (typeof seed.startTime === "string") {
                startTime = seed.startTime;
              } else if (typeof seed.timeStartMin === "number") {
                startTime = minutesToTimeString(seed.timeStartMin);
              }

              let endTime: string | null = null;
              if (typeof seed.endTime === "string") {
                endTime = seed.endTime;
              } else if (typeof seed.timeEndMin === "number") {
                endTime = minutesToTimeString(seed.timeEndMin);
              }

              const type =
                seed.type ??
                seed.kind ??
                "activity";

              // 아이템 생성
              items[itemId] = {
                id: itemId,
                tripId,
                dayId: targetDayId,
                type,
                title,
                note: seed.note ?? seed.memo ?? "",
                startTime,
                endTime,
                cost: seed.costVnd ?? seed.cost ?? null,
                transportMode:
                  seed.transportMode ??
                  template.meta.defaultMode ??
                  "car",
                placeId,
                createdAt: now,
                updatedAt: now,
              } as Item;

              // Day에 아이템 연결
              dayEntity.itemIds.push(itemId);
            });
          });
        }

        const trip: Trip = {
          id: tripId,
          title: template.meta.title ?? "샘플 여행",
          startDateISO: start,
          nights,
          dayIds,
          createdAt: now,
          updatedAt: now,
          budgetTotal: template.meta.plannedBudgetVnd ?? null,
          currency: template.meta.currency ?? "VND",
          transportDefault: template.meta.defaultMode ?? "car",
          baseHotelPlaceId: null,
          templateMeta: template.meta ?? null,
          isSample: isSample ?? true,
        } as Trip;

        set((prev) => ({
          ...prev,
          trips: {
            ...prev.trips,
            [tripId]: trip,
          },
          days: {
            ...prev.days,
            ...days,
          },
          items: {
            ...prev.items,
            ...items,
          },
          places: {
            ...prev.places,
            ...places,
          },
          currentTripId: tripId,
          lastSampleTripId: tripId,
        }));

        return tripId;
      },

      setLastSampleTripId: (tripId) => {
        set((prev) => ({
          ...prev,
          lastSampleTripId: tripId,
        }));
      },

      // 현재 여행만 삭제
      deleteTrip: (tripId) => {
        set((prev) => {
          const trip = prev.trips[tripId];
          if (!trip) return prev;

          // 해당 여행의 Day/Item/Place/Link 정리
          const dayIdSet = new Set<string>(trip.dayIds);
          const itemIdSet = new Set<string>();
          const placeIdSet = new Set<string>();

          trip.dayIds.forEach((dayId) => {
            const day = prev.days[dayId];
            if (!day) return;
            day.itemIds.forEach((itemId) => {
              itemIdSet.add(itemId);
              const it = prev.items[itemId];
              if (it?.placeId) {
                placeIdSet.add(it.placeId);
              }
            });
          });

          if (trip.baseHotelPlaceId) {
            placeIdSet.add(trip.baseHotelPlaceId);
          }

          const tripsPatched: EntityMap<Trip> = { ...prev.trips };
          delete tripsPatched[tripId];

          const daysPatched: EntityMap<Day> = { ...prev.days };
          dayIdSet.forEach((id) => {
            delete daysPatched[id];
          });

          const itemsPatched: EntityMap<Item> = { ...prev.items };
          itemIdSet.forEach((id) => {
            delete itemsPatched[id];
          });

          const linksPatched: EntityMap<Link> = { ...prev.links };
          Object.entries(linksPatched).forEach(([id, link]) => {
            if (
              link.tripId === tripId ||
              itemIdSet.has(link.fromItemId) ||
              itemIdSet.has(link.toItemId)
            ) {
              delete linksPatched[id];
            }
          });

          const placesPatched: EntityMap<Place> = { ...prev.places };
          placeIdSet.forEach((id) => {
            delete placesPatched[id];
          });

          let currentTripId = prev.currentTripId;
          if (currentTripId === tripId) {
            const remainingIds = Object.keys(tripsPatched);
            currentTripId = remainingIds.length ? remainingIds[0] : null;
          }

          let lastSampleTripId = prev.lastSampleTripId;
          if (lastSampleTripId === tripId) {
            lastSampleTripId = null;
          }

          return {
            ...prev,
            trips: tripsPatched,
            days: daysPatched,
            items: itemsPatched,
            links: linksPatched,
            places: placesPatched,
            currentTripId,
            lastSampleTripId,
          };
        });
      },

      // 전체 플랜 초기화
      resetAllTrips: () => {
        set(() => ({
          ...initialState,
        }));
      },

      // ─────────────────────────────────────────────────────
      // Distance Matrix
      // ─────────────────────────────────────────────────────

      requestDistanceMatrixForTrip: async (tripId, mode) => {
        const state = get();
        const trip = state.trips[tripId];
        if (!trip) return;

        const itemsByDay: Item[][] = trip.dayIds.map((dayId) => {
          const day = state.days[dayId];
          if (!day) return [];
          return day.itemIds
            .map((id) => state.items[id])
            .filter((it): it is Item => !!it);
        });

        const itemsFlattened = itemsByDay.flat();

        const places = state.places;

        const args = buildAdjacencyArgs({
          tripId,
          items: itemsFlattened,
          places,
          mode,
        });

        if (!args.pairs.length) {
          set((prev) => ({
            ...prev,
            distanceMatrix: {
              ...prev.distanceMatrix,
              mode,
              loading: false,
              error: null,
            },
          }));
          return;
        }

        set((prev) => ({
          ...prev,
          distanceMatrix: {
            ...prev.distanceMatrix,
            mode,
            loading: true,
            error: null,
          },
        }));

        try {
          const resp = await getMatrix(args);
          const metricsByKey: Record<string, LinkMetrics> = {
            ...state.distanceMatrix.metricsByKey,
          };

          resp.routes.forEach((route) => {
            const segmentItems = diagonalSegments(
              route.orderedItemIds,
            );
            segmentItems.forEach(({ from, to }) => {
              const key = `${tripId}:${from}:${to}`;
              metricsByKey[key] = {
                distanceMeters: route.distanceMeters,
                durationSeconds: route.durationSeconds,
                polyline: route.polyline,
                mode,
              };
            });
          });

          set((prev) => ({
            ...prev,
            distanceMatrix: {
              ...prev.distanceMatrix,
              mode,
              loading: false,
              error: null,
              metricsByKey,
            },
          }));
        } catch (error: any) {
          set((prev) => ({
            ...prev,
            distanceMatrix: {
              ...prev.distanceMatrix,
              mode,
              loading: false,
              error: error?.message ?? "Failed to load distance matrix",
            },
          }));
        }
      },

      clearDistanceMatrix: () => {
        set((prev) => ({
          ...prev,
          distanceMatrix: createEmptyDistanceMatrixState(),
        }));
      },
    }),
    {
      name: "plan-store-v4", // 버전 업데이트 (v3 -> v4)
      storage: createJSONStorage(() => localStorage),
      version: 4,
      partialize: (state) => {
        // currentTripId / lastSampleTripId 는 저장하지 않아서
        // 새로 들어올 때 메인 화면으로 시작하게 함
        const {
          distanceMatrix,
          currentTripId,
          lastSampleTripId,
          ...rest
        } = state;
        return rest;
      },
      migrate: (persisted, version) => {
        const base: any = persisted ?? {};
        if (version < 2) {
          base.currentTripId = null;
        }
        if (version < 3) {
          base.lastSampleTripId = null;
        }
        if (version < 4) {
          // v4부터는 항상 메인에서 시작하게 두 값 초기화
          base.currentTripId = null;
          base.lastSampleTripId = null;
        }
        return base;
      },
    },
  ),
);