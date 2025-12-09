// hooks/usePlanWizard.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { addDays, formatISO } from "date-fns";
import { nanoid } from "@/utils/id";
import { usePlanStore } from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

export type TripState = {
  startDate: string;
  nights: number;
  timezone?: string;
};
export type BudgetState = { currency: string; total: number };
export type BaseState = { hotelName?: string; lat?: number; lng?: number };
export type TransportState = {
  defaultMode: "walk" | "car" | "transit" | "bike";
};
export type SeedSpot = {
  id?: string;
  title: string;
  lat?: number;
  lng?: number;
  cost?: number;
};
export type SeedState = { spots: SeedSpot[] };

const DRAFT_KEY = "plan-wizard-draft";

export function usePlanWizard() {
  const [step, setStep] = useState<number>(0);

  // 각 스텝 상태
  const [trip, setTrip] = useState<TripState>({
    startDate: formatISO(new Date(), { representation: "date" }),
    nights: 3,
  });
  const [budget, setBudget] = useState<BudgetState>({
    currency: "VND",
    total: 0,
  });
  const [base, setBase] = useState<BaseState>({});
  const [transport, setTransport] = useState<TransportState>({
    defaultMode: "walk",
  });
  const [seed, setSeed] = useState<SeedState>({ spots: [] });

  // 초기에 draft 복원 (있으면)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.trip) setTrip(parsed.trip);
      if (parsed.budget) setBudget(parsed.budget);
      if (parsed.base) setBase(parsed.base);
      if (parsed.transport) setTransport(parsed.transport);
      if (parsed.seed) setSeed(parsed.seed);
    } catch {
      // 실패해도 조용히 무시
    }
  }, []);

  const bind = (
    key: "trip" | "budget" | "base" | "transport" | "seed"
  ):
    | { value: TripState; onChange: (v: TripState) => void }
    | { value: BudgetState; onChange: (v: BudgetState) => void }
    | { value: BaseState; onChange: (v: BaseState) => void }
    | { value: TransportState; onChange: (v: TransportState) => void }
    | { value: SeedState; onChange: (v: SeedState) => void } =>
    ({
      trip: { value: trip, onChange: setTrip },
      budget: { value: budget, onChange: setBudget },
      base: { value: base, onChange: setBase },
      transport: { value: transport, onChange: setTransport },
      seed: { value: seed, onChange: setSeed },
    }[key]);

  const canPrev = step > 0;
  const canNext = useMemo(() => {
    if (step === 0) return !!trip.startDate && trip.nights > 0;
    if (step === 1) return budget.total >= 0 && !!budget.currency;
    if (step === 2) return true;
    if (step === 3) return !!transport.defaultMode;
    if (step === 4) return true;
    return false;
  }, [step, trip, budget, transport]);

  const next = () => setStep((s) => Math.min(4, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  // 현재 store 스냅샷
  const store = usePlanStore.getState();
  const uiStore = usePlanUIStore.getState();

  async function saveDraft() {
    const payload = { trip, budget, base, transport, seed };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch {
      // quota 등 실패 시 조용히 무시
    }
  }

  async function complete() {
    const { createTrip, setTripMeta } = store as any;
    if (!createTrip) return;

    // 1) 트립 생성 (store의 createTrip 패턴에 맞춤)
    const tripId: string = createTrip({
      startDateISO: trip.startDate,
      nights: trip.nights,
      currency: budget.currency,
      budgetTotal: budget.total,
      transportDefault: transport.defaultMode,
    });

    // 2) 거점 메타
    if (setTripMeta) {
      setTripMeta(tripId, {
        baseHotelName: base.hotelName,
        baseLat: base.lat,
        baseLng: base.lng,
      });
    }

    // 3) days 중 첫째날 찾기
    const after = usePlanStore.getState() as any;
    const allDays = Object.values(after.days ?? {}) as any[];
    const tripDays = allDays
      .filter((d) => d.tripId === tripId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const firstDay = tripDays[0];

    // 4) 시드 스팟을 첫째날에 삽입
    const addItem = (after as any).addItem as any;
    if (firstDay && seed.spots.length && typeof addItem === "function") {
      for (const s of seed.spots) {
        addItem(firstDay.id, {
          id: nanoid(),
          tripId,
          dayId: firstDay.id,
          type: "spot",
          title: s.title,
          cost: s.cost ?? 0,
          location:
            typeof s.lat === "number" && typeof s.lng === "number"
              ? { lat: s.lat, lng: s.lng }
              : undefined,
        });
      }
    }

    // 5) 첫째 날 선택
    if (firstDay && typeof uiStore.setCurrentDayId === "function") {
      uiStore.setCurrentDayId(firstDay.id);
    }

    // 6) draft 정리
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // 무시
    }
  }

  return { step, canPrev, canNext, prev, next, complete, bind, saveDraft };
}
