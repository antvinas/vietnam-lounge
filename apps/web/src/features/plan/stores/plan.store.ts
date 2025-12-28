// apps/web/src/features/plan/stores/plan.store.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import { addDays, parseISO, formatISO } from "date-fns";
import toast from "react-hot-toast";

// API 함수 임포트
import { updatePlan, getPlanById } from "@/api/plan.api";

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

import { getTemplate } from "@/features/plan/data/templates";
import {
  buildAdjacencyArgs,
  diagonalSegments,
  type Mode as DistanceMode,
} from "@/hooks/useDistanceMatrix";
import { getMatrix } from "@/services/distance";

export type { Trip, Day, Item, Link, Place, TransportMode };

export interface GooglePlaceLike {
  placeId: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
}

// ─────────────────────────────────────────────────────────────
// Distance Matrix State Definition
// ─────────────────────────────────────────────────────────────

export type DistanceMatrixState = {
  mode: DistanceMode | null;
  loading: boolean;
  error: string | null;
  metricsByKey: Record<string, LinkMetrics>;
};

export function createEmptyDistanceMatrixState(): DistanceMatrixState {
  return {
    mode: null,
    loading: false,
    error: null,
    metricsByKey: {},
  };
}

// ─────────────────────────────────────────────────────────────
// Input Types
// ─────────────────────────────────────────────────────────────

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
  templateId?: string;
  currency?: string;
  budgetTotal?: number;
  transportDefault?: TransportMode;
};

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
  insertAfterIndex?: number;
};

// ─────────────────────────────────────────────────────────────
// State Interface
// ─────────────────────────────────────────────────────────────

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

export interface PlanStore extends PlanState {
  createTrip(input: CreateTripInput): string;
  setCurrentTripId(tripId: string | null): void;
  setTripTitle(tripId: string, title: string): void;
  setTripDates(tripId: string, startDateISO: string, nights: number): void;
  setTripBudget(tripId: string, budgetTotal: number | null): void;
  setTripCurrency(tripId: string, currency: string): void;
  setTripTransportDefault(tripId: string, mode: TransportMode): void;
  setTripBaseHotel(
    tripId: string,
    baseHotel: {
      name: string;
      lat: number;
      lng: number;
      address?: string;
    } | null
  ): void;

  addDay(tripId: string, dateISO: string): string;
  removeDay(dayId: string): void;

  addItem(input: AddItemInput): string;
  updateItem(itemId: string, patch: Partial<Item>): void;
  removeItem(itemId: string): void;
  moveItemWithinDay(dayId: string, fromIndex: number, toIndex: number): void;

  addLink(fromItemId: string, toItemId: string, mode: TransportMode): string | null;
  updateLink(linkId: string, patch: Partial<Link>): void;
  removeLink(linkId: string): void;

  upsertPlace(place: Place): string;
  removePlace(placeId: string): void;

  importSampleTrip(options: any): string;
  setLastSampleTripId(tripId: string | null): void;

  deleteTrip(tripId: string): void;
  resetAllTrips(): void;

  requestDistanceMatrixForTrip(
    tripId: string,
    mode: DistanceMode
  ): Promise<void> | void;
  clearDistanceMatrix(): void;

  saveTripToServer: (tripId: string, ownerId: string) => Promise<void>;
  loadTripFromServer: (planId: string) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// Selectors (EXPORTED FUNCTIONS)
// ─────────────────────────────────────────────────────────────

export function selectCurrentTrip(state: PlanState): Trip | null {
  if (!state.currentTripId) return null;
  return state.trips[state.currentTripId] ?? null;
}

export function selectDaysOfTrip(state: PlanState, tripId?: string | null): Day[] {
  const effectiveTripId = tripId ?? state.currentTripId;
  if (!effectiveTripId) return [];

  const trip = state.trips[effectiveTripId];
  if (!trip) return [];

  return trip.dayIds
    .map((dayId) => state.days[dayId])
    .filter((day): day is Day => !!day);
}

function resolveEffectiveDayId(state: PlanState, dayId?: string | null): string | null {
  if (dayId && state.days[dayId]) return dayId;

  const tripId = state.currentTripId;
  if (!tripId) return null;

  const trip = state.trips[tripId];
  const fallback = trip?.dayIds?.[0] ?? null;
  if (fallback && state.days[fallback]) return fallback;

  return null;
}

export function selectItemsOfDay(state: PlanState, dayId?: string | null): Item[] {
  const effectiveDayId = resolveEffectiveDayId(state, dayId);
  if (!effectiveDayId) return [];

  const day = state.days[effectiveDayId];
  if (!day) return [];

  return day.itemIds
    .map((itemId) => state.items[itemId])
    .filter((item): item is Item => !!item);
}

export function selectConflictsOfDay(state: PlanState, dayId?: string | null): string[] {
  void resolveEffectiveDayId(state, dayId);
  return [];
}

export function selectBudgetLeft(state: PlanState, tripId?: string | null): number | null {
  const trip = tripId ? state.trips[tripId] : selectCurrentTrip(state);
  if (!trip || trip.budgetTotal == null) return null;

  const days = selectDaysOfTrip(state, trip.id);
  let used = 0;

  days.forEach((day) => {
    day.itemIds.forEach((itemId) => {
      const item = state.items[itemId];
      if (item && item.cost) {
        used += item.cost;
      }
    });
  });

  return trip.budgetTotal - used;
}

// ─────────────────────────────────────────────────────────────
// Helper Utilities
// ─────────────────────────────────────────────────────────────

function formatDateOnly(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatISO(d, { representation: "date" });
}

function minutesToTimeString(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function createDaysForTrip(
  tripId: string,
  startDateISO: string,
  nights: number
): { dayIds: string[]; days: EntityMap<Day> } {
  const dayIds: string[] = [];
  const days: EntityMap<Day> = {};
  const base = parseISO(startDateISO);

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
// Store Implementation
// ─────────────────────────────────────────────────────────────

export const usePlanStore = create<PlanStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      saveTripToServer: async (tripId, ownerId) => {
        const state = get();
        const trip = state.trips[tripId];
        if (!trip) {
           toast.error("저장할 여행 정보를 찾을 수 없습니다.");
           return;
        }

        const relevantDays = selectDaysOfTrip(state, tripId);
        const relevantItems: Record<string, Item> = {};
        const relevantPlaces: Record<string, Place> = {};
        
        relevantDays.forEach(day => {
            day.itemIds.forEach(itemId => {
                const item = state.items[itemId];
                if(item) {
                    relevantItems[itemId] = item;
                    if(item.placeId && state.places[item.placeId]) {
                        relevantPlaces[item.placeId] = state.places[item.placeId];
                    }
                }
            });
        });

        if(trip.baseHotelPlaceId && state.places[trip.baseHotelPlaceId]){
            relevantPlaces[trip.baseHotelPlaceId] = state.places[trip.baseHotelPlaceId];
        }

        const dayMap = relevantDays.reduce((acc, day) => ({...acc, [day.id]: day}), {});

        const payload = {
            ownerId,
            title: trip.title,
            schedule: [],
            data: { 
                trip, 
                days: dayMap, 
                items: relevantItems, 
                places: relevantPlaces 
            },
            nightMode: false
        };

        try {
            await updatePlan({ planId: tripId, ...payload });
            toast.success("여행 일정이 저장되었습니다.");
        } catch (error) {
            console.error(error);
            toast.error("저장 중 오류가 발생했습니다.");
        }
      },

      loadTripFromServer: async (planId) => {
          try {
            const plan = await getPlanById(planId);
            if(!plan || !plan.data) return;

            const { trip, days, items, places } = plan.data as any;

            set(prev => ({
                trips: { ...prev.trips, [trip.id]: trip },
                days: { ...prev.days, ...days },
                items: { ...prev.items, ...items },
                places: { ...prev.places, ...places },
                currentTripId: trip.id
            }));
            
            toast.success("여행 일정을 불러왔습니다.");
          } catch(e) {
              console.error(e);
              toast.error("일정을 불러오는 데 실패했습니다.");
          }
      },

      createTrip: (input) => {
        const id = nanoid();
        const now = new Date().toISOString();
        const start = formatDateOnly(input.startDateISO);
        const nights = Math.max(1, input.nights);

        const { dayIds, days } = createDaysForTrip(id, start, nights);

        const trip: Trip = {
          id,
          title: input.title,
          startDateISO: start,
          nights,
          dayIds,
          createdAt: now,
          updatedAt: now,
          budgetTotal: input.budgetTotal ?? undefined,
          currency: input.currency || "VND",
          transportDefault: input.transportDefault || "car",
          baseHotelPlaceId: null,
          templateMeta: input.templateMeta ?? null,
          isSample: input.isSample ?? false,
        };

        let placesPatched = { ...get().places };
        if (input.baseHotel) {
          const hotelId = nanoid();
          placesPatched[hotelId] = {
            id: hotelId,
            name: input.baseHotel.name,
            lat: input.baseHotel.lat,
            lng: input.baseHotel.lng,
            address: input.baseHotel.address ?? "",
            createdAt: now,
            updatedAt: now,
            source: "user",
          } as Place;
          trip.baseHotelPlaceId = hotelId;
        }

        set((prev) => ({
          ...prev,
          trips: { ...prev.trips, [id]: trip },
          days: { ...prev.days, ...days },
          places: placesPatched,
          currentTripId: id,
        }));

        return id;
      },

      setCurrentTripId: (tripId) => set({ currentTripId: tripId }),

      setTripTitle: (tripId, title) => {
        set((prev) => {
          const trip = prev.trips[tripId];
          if (!trip) return {};
          return {
            trips: {
              ...prev.trips,
              [tripId]: { ...trip, title, updatedAt: new Date().toISOString() },
            },
          };
        });
      },

      setTripDates: (tripId, startDateISO, nights) => {
        set((prev) => {
          const trip = prev.trips[tripId];
          if (!trip) return {};

          const base = parseISO(startDateISO);
          const currentDayIds = [...trip.dayIds];
          const daysPatched = { ...prev.days };
          
          currentDayIds.forEach((dayId, idx) => {
             if (daysPatched[dayId]) {
                const newDate = addDays(base, idx);
                daysPatched[dayId] = {
                   ...daysPatched[dayId],
                   dateISO: formatDateOnly(newDate),
                   order: idx
                };
             }
          });

          if (nights > trip.nights) {
             for(let i = trip.nights + 1; i <= nights; i++) {
                const id = nanoid();
                const date = addDays(base, i);
                currentDayIds.push(id);
                daysPatched[id] = {
                   id,
                   tripId,
                   dateISO: formatDateOnly(date),
                   itemIds: [],
                   order: i
                } as Day;
             }
          } else if (nights < trip.nights) {
             const removeCount = trip.nights - nights;
             const removedIds = currentDayIds.splice(currentDayIds.length - removeCount, removeCount);
             removedIds.forEach(id => {
                delete daysPatched[id];
             });
          }

          return {
            trips: {
               ...prev.trips,
               [tripId]: {
                  ...trip,
                  startDateISO,
                  nights,
                  dayIds: currentDayIds,
                  updatedAt: new Date().toISOString()
               }
            },
            days: daysPatched
          };
        });
      },

      setTripBudget: (tripId, budgetTotal) => {
        set((prev) => {
          const trip = prev.trips[tripId];
          if (!trip) return {};
          return {
            trips: {
              ...prev.trips,
              [tripId]: { ...trip, budgetTotal: budgetTotal ?? undefined, updatedAt: new Date().toISOString() },
            },
          };
        });
      },

      setTripCurrency: (tripId, currency) => {
        set((prev) => {
          const trip = prev.trips[tripId];
          if (!trip) return {};
          return {
            trips: {
              ...prev.trips,
              [tripId]: { ...trip, currency, updatedAt: new Date().toISOString() },
            },
          };
        });
      },

      setTripTransportDefault: (tripId, mode) => {
        set((prev) => {
          const trip = prev.trips[tripId];
          if (!trip) return {};
          return {
            trips: {
              ...prev.trips,
              [tripId]: { ...trip, transportDefault: mode, updatedAt: new Date().toISOString() },
            },
          };
        });
      },

      setTripBaseHotel: (tripId, baseHotel) => {
        set((prev) => {
          const trip = prev.trips[tripId];
          if (!trip) return {};

          let placesPatched = { ...prev.places };
          let baseHotelPlaceId = trip.baseHotelPlaceId;

          if (baseHotel) {
            if (!baseHotelPlaceId) {
              baseHotelPlaceId = nanoid();
            }
            placesPatched[baseHotelPlaceId] = {
              id: baseHotelPlaceId,
              name: baseHotel.name,
              lat: baseHotel.lat,
              lng: baseHotel.lng,
              address: baseHotel.address ?? "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              source: "user",
            } as Place;
          } else {
            if (baseHotelPlaceId) {
              delete placesPatched[baseHotelPlaceId];
              baseHotelPlaceId = null;
            }
          }

          return {
            trips: {
              ...prev.trips,
              [tripId]: { ...trip, baseHotelPlaceId, updatedAt: new Date().toISOString() },
            },
            places: placesPatched,
          };
        });
      },

      addDay: (tripId, dateISO) => {
        const id = nanoid();
        set((prev) => {
          const trip = prev.trips[tripId];
          if (!trip) return {};
          return {
            trips: {
              ...prev.trips,
              [tripId]: {
                ...trip,
                nights: trip.nights + 1,
                dayIds: [...trip.dayIds, id],
                updatedAt: new Date().toISOString(),
              },
            },
            days: {
              ...prev.days,
              [id]: {
                id,
                tripId,
                dateISO,
                itemIds: [],
                order: trip.dayIds.length,
              } as Day,
            },
          };
        });
        return id;
      },

      removeDay: (dayId) => {
        set((prev) => {
          const day = prev.days[dayId];
          if (!day) return {};
          const trip = prev.trips[day.tripId];
          if (!trip) return {};

          const newDayIds = trip.dayIds.filter((id) => id !== dayId);
          const newDays = { ...prev.days };
          delete newDays[dayId];
          const newItems = { ...prev.items };
          day.itemIds.forEach((itemId) => delete newItems[itemId]);

          return {
            trips: {
              ...prev.trips,
              [trip.id]: {
                ...trip,
                nights: Math.max(1, trip.nights - 1),
                dayIds: newDayIds,
                updatedAt: new Date().toISOString(),
              },
            },
            days: newDays,
            items: newItems,
          };
        });
      },

      addItem: (input) => {
        const id = nanoid();
        set((prev) => {
          const day = prev.days[input.dayId];
          if (!day) return {};
          const now = new Date().toISOString();
          let placeId = input.placeId;
          const placesPatched = { ...prev.places };

          if (!placeId && input.googlePlace) {
            placeId = nanoid();
            placesPatched[placeId] = {
              id: placeId,
              name: input.googlePlace.name,
              lat: input.googlePlace.lat,
              lng: input.googlePlace.lng,
              address: input.googlePlace.address ?? "",
              googlePlaceId: input.googlePlace.placeId,
              source: "user",
              createdAt: now,
              updatedAt: now,
            } as Place;
          }

          // 🟢 안전 장치: type이 없으면 "activity" 대신 "place"로 설정 (UI 호환성 증대)
          const itemType = input.type ?? "place";

          const item: Item = {
            id,
            tripId: input.tripId,
            dayId: input.dayId,
            type: itemType,
            title: input.title ?? "새 일정",
            note: input.note ?? "",
            startTime: input.startTime ?? null,
            endTime: input.endTime ?? null,
            cost: input.cost ?? null,
            transportMode: input.transportMode ?? "car",
            placeId: placeId ?? null,
            order: day.itemIds.length,
            createdAt: now,
            updatedAt: now,
          };

          const nextItemIds = [...day.itemIds];
          if (
            typeof input.insertAfterIndex === "number" &&
            input.insertAfterIndex >= 0 &&
            input.insertAfterIndex < nextItemIds.length
          ) {
            nextItemIds.splice(input.insertAfterIndex + 1, 0, id);
          } else {
            nextItemIds.push(id);
          }

          return {
            items: { ...prev.items, [id]: item },
            days: { ...prev.days, [input.dayId]: { ...day, itemIds: nextItemIds } },
            places: placesPatched,
          };
        });
        return id;
      },

      updateItem: (itemId, patch) => {
        set((prev) => {
          const item = prev.items[itemId];
          if (!item) return {};
          return {
            items: {
              ...prev.items,
              [itemId]: { ...item, ...patch, updatedAt: new Date().toISOString() },
            },
          };
        });
      },

      removeItem: (itemId) => {
        set((prev) => {
          const item = prev.items[itemId];
          if (!item) return {};
          const day = prev.days[item.dayId];
          
          const newItems = { ...prev.items };
          delete newItems[itemId];

          const newDays = { ...prev.days };
          if (day) {
            newDays[day.id] = {
              ...day,
              itemIds: day.itemIds.filter((id) => id !== itemId),
            };
          }

          const newLinks = { ...prev.links };
          Object.values(prev.links).forEach((link) => {
            if (link.fromItemId === itemId || link.toItemId === itemId) {
              delete newLinks[link.id];
            }
          });

          return {
            items: newItems,
            days: newDays,
            links: newLinks,
          };
        });
      },

      moveItemWithinDay: (dayId, fromIndex, toIndex) => {
        set((prev) => {
          const day = prev.days[dayId];
          if (!day) return {};
          const newItemIds = [...day.itemIds];
          const [movedItemId] = newItemIds.splice(fromIndex, 1);
          newItemIds.splice(toIndex, 0, movedItemId);
          return {
            days: {
              ...prev.days,
              [dayId]: { ...day, itemIds: newItemIds },
            },
          };
        });
      },

      addLink: (fromItemId, toItemId, mode) => {
        const id = nanoid();
        set((prev) => {
          const fromItem = prev.items[fromItemId];
          if (!fromItem) return {};
          return {
            links: {
              ...prev.links,
              [id]: {
                id,
                tripId: fromItem.tripId,
                fromItemId,
                toItemId,
                mode,
              },
            },
          };
        });
        return id;
      },

      updateLink: (linkId, patch) => {
        set((prev) => {
          const link = prev.links[linkId];
          if (!link) return {};
          return {
            links: { ...prev.links, [linkId]: { ...link, ...patch } },
          };
        });
      },

      removeLink: (linkId) => {
        set((prev) => {
          const newLinks = { ...prev.links };
          delete newLinks[linkId];
          return { links: newLinks };
        });
      },

      upsertPlace: (place) => {
        set((prev) => ({
          places: { ...prev.places, [place.id]: place },
        }));
        return place.id;
      },

      removePlace: (placeId) => {
        set((prev) => {
          const newPlaces = { ...prev.places };
          delete newPlaces[placeId];
          return { places: newPlaces };
        });
      },

      // 🟢 [핵심 수정] 만능 템플릿 임포터 + 타입 강제 변환
      importSampleTrip: (options) => {
        const templateId = options.templateId || "nhatrang-3n4d";
        
        let template;
        try {
           template = getTemplate(templateId);
        } catch(e) {
           console.error("Template not found:", e);
           return get().createTrip({
              title: "새 여행",
              startDateISO: options.startDate || formatDateOnly(new Date()),
              nights: 3,
              isSample: true
           });
        }

        const tripId = nanoid();
        const now = new Date().toISOString();
        const start = options.startDate ?? formatDateOnly(new Date());
        
        const nights = template.meta.nights; 
        const { dayIds, days } = createDaysForTrip(tripId, start, nights);

        const items: EntityMap<Item> = {};
        const places: EntityMap<Place> = {};

        template.days.forEach((daySeed, idx) => {
          const targetDayId = dayIds[idx];
          if (!targetDayId) return;
          const dayEntity = days[targetDayId];

          daySeed.items.forEach((seed: any) => {
            const itemId = nanoid();
            let placeId: string | null = null;

            // 1. 위치 정보 확인
            const loc = seed.location || seed.geo || seed.coordinate || 
                       (seed.lat && seed.lng ? { lat: seed.lat, lng: seed.lng } : null);
            
            // 2. 주소 정보 (없으면 빈 문자열 안전 처리)
            const address = seed.address || seed.addr || (loc && loc.address) || "";

            // 🟢 [중요] 타입 강제 변환: 위치가 있으면 무조건 'place'로 설정
            // 템플릿의 'activity', 'spot', 'meal'을 UI가 아는 'place'로 통일
            let itemType = seed.kind || "place";
            if (["activity", "spot", "meal", "attraction"].includes(itemType)) {
                itemType = "place";
            }
            // 위치가 없는데 kind가 모호하면 note로 변경
            if (!loc && itemType === "place") {
                itemType = "note";
            }

            if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
              placeId = nanoid();
              places[placeId] = {
                id: placeId,
                name: seed.name,
                lat: loc.lat,
                lng: loc.lng,
                address: address, 
                source: "template",
                createdAt: now,
                updatedAt: now,
              } as Place;
            }

            // 3. 시간 정보 포맷 호환
            let startT = null;
            if (seed.startTime) startT = seed.startTime;
            else if (typeof seed.timeStartMin === 'number') startT = minutesToTimeString(seed.timeStartMin);

            let endT = null;
            if (seed.endTime) endT = seed.endTime;
            else if (typeof seed.timeEndMin === 'number') endT = minutesToTimeString(seed.timeEndMin);

            // 4. 메모 필드 안전 처리
            const noteContent = seed.note || seed.memo || seed.description || seed.desc || "";

            items[itemId] = {
              id: itemId,
              tripId,
              dayId: targetDayId,
              type: itemType as any, // 강제 변환된 타입 사용
              title: seed.name,
              note: noteContent,
              startTime: startT,
              endTime: endT,
              cost: seed.costVnd,
              transportMode: "car",
              placeId,
              order: dayEntity.itemIds.length,
              createdAt: now,
              updatedAt: now,
            };

            dayEntity.itemIds.push(itemId);
          });
        });

        const trip: Trip = {
          id: tripId,
          title: template.meta.title,
          startDateISO: start,
          nights,
          dayIds,
          budgetTotal: template.meta.plannedBudgetVnd,
          currency: template.meta.currency,
          transportDefault: template.meta.defaultMode,
          baseHotelPlaceId: null,
          templateMeta: template.meta,
          isSample: true,
          createdAt: now,
          updatedAt: now,
        };

        if (template.base) {
           const baseId = nanoid();
           const baseLoc = template.base.location || template.base.geo || { lat: 0, lng: 0 };
           places[baseId] = {
              id: baseId,
              name: template.base.name,
              lat: baseLoc.lat,
              lng: baseLoc.lng,
              address: template.base.address ?? "",
              source: "template",
              createdAt: now,
              updatedAt: now
           } as Place;
           trip.baseHotelPlaceId = baseId;
        }

        set((prev) => ({
          ...prev,
          trips: { ...prev.trips, [tripId]: trip },
          days: { ...prev.days, ...days },
          items: { ...prev.items, ...items },
          places: { ...prev.places, ...places },
          currentTripId: tripId,
          lastSampleTripId: tripId,
        }));

        return tripId;
      },

      setLastSampleTripId: (tripId) => set({ lastSampleTripId: tripId }),

      deleteTrip: (tripId) => {
        set((prev) => {
          const newTrips = { ...prev.trips };
          delete newTrips[tripId];
          let nextCurrent = prev.currentTripId;
          if (nextCurrent === tripId) {
            nextCurrent = Object.keys(newTrips)[0] || null;
          }
          return {
            trips: newTrips,
            currentTripId: nextCurrent,
          };
        });
      },

      resetAllTrips: () => set(initialState),

      requestDistanceMatrixForTrip: async (tripId, mode) => {
        const state = get();
        const trip = state.trips[tripId];
        if (!trip) return;

        const items = selectDaysOfTrip(state, tripId)
          .flatMap(day => selectItemsOfDay(state, day.id));

        const args = (buildAdjacencyArgs as any)({
          tripId,
          items,
          places: state.places,
          mode,
        });

        if (!args || !args.pairs || args.pairs.length === 0) return;

        set((prev) => ({
          distanceMatrix: { ...prev.distanceMatrix, mode, loading: true, error: null }
        }));

        try {
          const resp: any = await getMatrix(args);
          const metricsByKey = { ...state.distanceMatrix.metricsByKey };
          const routes = Array.isArray(resp) ? resp : (resp.routes || []);

          routes.forEach((route: any) => {
            const segmentItems = diagonalSegments(route.orderedItemIds);
            segmentItems.forEach(({ from, to }: any) => {
              const key = `${tripId}:${from}:${to}`;
              let transportMode: TransportMode = "car";
              if (mode === "WALKING") transportMode = "walk";
              else if (mode === "TRANSIT") transportMode = "transit";
              else if (mode === "BICYCLING") transportMode = "bike";

              metricsByKey[key] = {
                distanceMeters: route.distanceMeters,
                durationSeconds: route.durationSeconds,
                polyline: route.polyline,
                mode: transportMode,
              };
            });
          });

          set((prev) => ({
            distanceMatrix: {
              ...prev.distanceMatrix,
              loading: false,
              metricsByKey,
            },
          }));
        } catch (e: any) {
          set((prev) => ({
            distanceMatrix: {
              ...prev.distanceMatrix,
              loading: false,
              error: e.message || "Distance check failed",
            },
          }));
        }
      },

      clearDistanceMatrix: () => {
        set({ distanceMatrix: createEmptyDistanceMatrixState() });
      },
    }),
    {
      name: "plan-store-v6",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const { distanceMatrix, ...rest } = state;
        return rest;
      },
    }
  )
);