import { getTemplate } from "@/features/plan/data/templates";
import type {
  GeneratedPlan,
  PlanTemplate,
  SampleGenOptions,
  ItemSeed,
  DaySeed,
  TemplateId,
} from "@/types/plan.template";
import { addDays, formatISO, nextWeekend } from "@/utils/date";
import { usePlanStore } from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

/**
 * 원클릭 샘플 생성 래퍼
 * - 있으면 store.importSampleTrip 사용
 * - 없으면 fallback(materialize+커밋)
 * - 필수 액션이 없으면 throw(무반응 금지)
 */
export async function generateSampleTrip(
  templateId: TemplateId,
  opt: SampleGenOptions = {}
) {
  const S: any = usePlanStore.getState?.();
  const U: any = usePlanUIStore.getState?.();
  const toast = (window as any)?.toast || (window as any)?.$toast;

  try {
    let tripId: string | undefined;

    if (S?.importSampleTrip) {
      tripId = await S.importSampleTrip(templateId, opt);
    } else {
      const template = getTemplate(templateId);
      const plan = materialize(template, opt);

      // Trip/Day/Item/Link 커밋(필수 액션 못 찾으면 예외)
      requireCall(S, ["addTrip", "createTrip", "upsertTrip", "setTrip"], plan.trip);

      const addDay = requireGet(S, ["addDay", "createDay", "upsertDay"]);
      const addItem = requireGet(S, ["addItem", "createItem", "upsertItem"]);
      const addLink = requireGet(S, ["addLink", "createLink", "upsertLink"]);

      plan.days.forEach((d) => addDay(d));
      plan.items.forEach((it) => addItem(it));
      plan.links.forEach((ln) => addLink(ln));

      // 메타 보정(있으면)
      callFirst(S, ["updateTripMeta", "patchTrip", "setTripMeta"], {
        id: plan.trip.id,
        currency: plan.trip.currency,
        transport: { defaultMode: plan.trip.transport?.defaultMode ?? template.meta.defaultMode },
        plannedBudget: { totalVnd: template.meta.plannedBudgetVnd },
      });

      // 링크 재계산(필수)
      const recalc = requireGet(S, ["recalcLinksForDay", "recalcDayLinks"]);
      plan.days.forEach((d) => recalc(d.id));

      // 현재 트립 포커스
      callFirst(S, ["setCurrentTrip", "focusTrip", "openTrip"], plan.trip.id);

      tripId = plan.trip.id;
    }

    if (!tripId) throw new Error("샘플 생성에 실패했습니다(Trip ID 없음).");

    // UI 포커스/위저드 종료
    const st = usePlanStore.getState();
    const days = Object.values(st.days)
      .filter((d: any) => d.tripId === tripId)
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    callFirst(U, ["setCurrentDayId", "selectDay", "setCurrentDay"], days[0]?.id);
    U?.closeWizard?.();

    toast?.success?.("샘플 일정이 생성됐어요. 언제든 수정/저장 가능해요.");
    return tripId;
  } catch (err: any) {
    const msg = err?.message || "샘플 생성 중 오류가 발생했습니다.";
    toast?.error?.(msg);
    console.error("[generateSampleTrip] failed:", err);
    throw err;
  }
}

/** 템플릿 → 실제 스토어 스키마로 전개(폴백용 순수 함수) */
export function materialize(template: PlanTemplate, opt: SampleGenOptions = {}): GeneratedPlan {
  const start = opt.startDate ?? formatISO(nextWeekend()); // 필요 시 today+7로 교체
  const nights = opt.nights ?? template.meta.nights;
  const currency = opt.currency ?? template.meta.currency;

  const tripId = `sample_${template.meta.id}_${Date.now()}`;
  const days: any[] = [];
  const items: any[] = [];
  const links: any[] = [];

  const trip: any = {
    id: tripId,
    title: template.meta.title,
    city: template.meta.city,
    startDate: start,
    nights,
    currency,
    timezone: "Asia/Ho_Chi_Minh",
    transport: { defaultMode: template.meta.defaultMode },
  };

  for (let i = 0; i < template.days.length; i++) {
    const date = formatISO(addDays(new Date(start), i));
    const dayId = `${tripId}_d${i + 1}`;
    days.push({ id: dayId, tripId, date, label: template.days[i]?.label ?? `Day ${i + 1}` });

    const seeds: DaySeed["items"] = template.days[i].items ?? [];
    seeds.forEach((seed: ItemSeed, idx: number) => {
      const id = `${dayId}_it${idx + 1}`;
      items.push({
        id,
        dayId,
        type: seed.kind,
        name: seed.name,
        note: seed.note,
        location: seed.location,
        timeStartMin: seed.timeStartMin,
        timeEndMin: seed.timeEndMin,
        openMin: seed.openMin,
        closeMin: seed.closeMin,
        costVnd: seed.costVnd,
      });
    });

    for (let k = 0; k < seeds.length - 1; k++) {
      const fromId = `${dayId}_it${k + 1}`;
      const toId = `${dayId}_it${k + 2}`;
      const mode = seeds[k]?.modeHint ?? template.meta.defaultMode;
      links.push({
        id: `${dayId}_ln${k + 1}`,
        fromItemId: fromId,
        toItemId: toId,
        mode,
        distanceMeters: null,
        durationSec: null, // 후속 재계산으로 채움
      });
    }
  }

  if (template.base) (trip as any).base = template.base;

  return { trip, days, items, links };
}

/* ===== 내부 유틸 ===== */
function getFirst<T extends object>(obj: T, keys: string[]): any | undefined {
  for (const k of keys) {
    const fn = (obj as any)?.[k];
    if (typeof fn === "function") return fn;
  }
  return undefined;
}
function callFirst<T extends object>(obj: T, keys: string[], ...args: any[]) {
  const fn = getFirst(obj, keys);
  if (fn) return fn(...args);
  console.warn("[generateSampleTrip] missing actions:", keys);
}
function requireGet<T extends object>(obj: T, keys: string[]) {
  const fn = getFirst(obj, keys);
  if (!fn) throw new Error(`[generateSampleTrip] 필요한 액션 없음: ${keys.join(" | ")}`);
  return fn;
}
function requireCall<T extends object>(obj: T, keys: string[], ...args: any[]) {
  const fn = requireGet(obj, keys);
  return fn(...args);
}
