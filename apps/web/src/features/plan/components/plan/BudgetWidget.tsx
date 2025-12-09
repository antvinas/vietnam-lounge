// src/components/plan/BudgetWidget.tsx
// 카테고리/일자 합계와 통화 표시. 정규화 스토어 셀렉터 사용.
// variant="summary" → PlanSummaryBar 안에서 칩 형태로 사용.

import { useEffect, useMemo, useState } from "react";
import {
  usePlanStore,
  selectCurrentTrip,
  selectDaysOfTrip,
  selectItemsOfDay,
  selectBudgetLeft,
} from "@/features/plan/stores/plan.store";

type Code = "VND" | "KRW" | "USD";
type RateMap = Record<Code, number>;

export type BudgetWidgetVariant = "panel" | "summary";

type Props = {
  defaultCurrency?: Code;
  budgetLimitVND?: number;
  variant?: BudgetWidgetVariant;
  className?: string;
};

async function fetchFrankfurter(codes: Code[]): Promise<RateMap> {
  const query = codes.join(",");
  const r = await fetch(
    `https://api.frankfurter.app/latest?from=EUR&to=${query}`
  );
  if (!r.ok) throw new Error("Frankfurter failed");
  const j = await r.json();
  if (!j?.rates) throw new Error("No rates");
  return j.rates as RateMap;
}

async function fetchExchangerateHost(codes: Code[]): Promise<RateMap> {
  const query = codes.join(",");
  const r = await fetch(
    `https://api.exchangerate.host/latest?base=EUR&symbols=${query}`
  );
  if (!r.ok) throw new Error("exchangerate.host failed");
  const j = await r.json();
  return j?.rates as RateMap;
}

function formatMoney(
  value: number,
  code: Code,
  rates: RateMap | null
): string {
  if (!rates) return `${value.toLocaleString()} ${code}`;
  const vEur = value / (rates.VND || 1); // 내부 기준을 VND라고 가정시 조정 가능
  let out = vEur;
  if (code === "KRW") out = vEur * rates.KRW;
  if (code === "USD") out = vEur * rates.USD;
  if (code === "VND") out = vEur * rates.VND;
  return `${Math.round(out).toLocaleString()} ${code}`;
}

export default function BudgetWidget({
  defaultCurrency,
  budgetLimitVND,
  variant = "panel",
  className,
}: Props) {
  const trip = usePlanStore(selectCurrentTrip);
  const tripId = trip?.id;

  // trip 단위 day 리스트
  const days = usePlanStore((s) =>
    tripId ? selectDaysOfTrip(s, tripId) ?? [] : []
  );

  // 모든 day의 items 수집
  const allItems = usePlanStore((s) => {
    if (!tripId) return [];
    const dlist = selectDaysOfTrip(s, tripId) ?? [];
    const items = dlist.flatMap((d) => selectItemsOfDay(s, d.id) ?? []);
    return items;
  });

  // 잔여 예산
  const budgetLeft = usePlanStore((s) =>
    tripId ? selectBudgetLeft(s, tripId) : 0
  );

  // 통화(표시용 로컬 상태)
  const [cur, setCur] = useState<Code>(
    (trip?.currency as Code) || defaultCurrency || "VND"
  );

  const [rates, setRates] = useState<RateMap | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const r = await fetchFrankfurter(["KRW", "VND", "USD"]);
        if (!ignore) setRates({ KRW: r.KRW, VND: r.VND, USD: r.USD });
      } catch {
        try {
          const r2 = await fetchExchangerateHost(["KRW", "VND", "USD"]);
          if (!ignore) setRates({ KRW: r2.KRW, VND: r2.VND, USD: r2.USD });
        } catch (e: any) {
          if (!ignore)
            setErr(
              e?.message ?? "환율 정보를 불러오지 못했습니다."
            );
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const dayLabelMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of days) {
      const label =
        (d as any).dateISO ||
        (d as any).date ||
        (d as any).key ||
        String((d as any).order ?? (d as any).id);
      m.set((d as any).id, label);
    }
    return m;
  }, [days]);

  // 카테고리/일자 합계
  const { totalVND, byCategory, byDate } = useMemo(() => {
    const catAgg: Record<string, number> = {};
    const dateAgg: Record<string, number> = {};
    let sum = 0;
    for (const it of allItems as any[]) {
      const cost =
        typeof it.cost === "number" ? it.cost : 0;
      const ckey =
        it.category ||
        it.meta?.category ||
        (it.type === "move" ? "transport" : it.type || "misc");
      const dkey = dayLabelMap.get(it.dayId) ?? "기타";
      sum += cost;
      catAgg[ckey] = (catAgg[ckey] ?? 0) + cost;
      dateAgg[dkey] = (dateAgg[dkey] ?? 0) + cost;
    }
    return {
      totalVND: sum,
      byCategory: catAgg,
      byDate: dateAgg,
    };
  }, [allItems, dayLabelMap]);

  const over =
    typeof budgetLimitVND === "number"
      ? totalVND > budgetLimitVND
      : false;

  const fmt = (v: number) => formatMoney(v, cur, rates);

  // summary 모드 (상단 칩)
  if (variant === "summary") {
    return (
      <div className={className ?? "flex flex-wrap items-center gap-2"}>
        <div className="summary-chip">
          <span className="summary-chip__label">사용한 예산</span>
          <span className="summary-chip__value">
            {fmt(totalVND || 0)}
          </span>
        </div>
        <div
          className={"summary-chip" + (over ? " danger" : "")}
        >
          <span className="summary-chip__label">남은 예산</span>
          <span className="summary-chip__value">
            {fmt(budgetLeft || 0)}
          </span>
        </div>
        <select
          className="ml-1 rounded-md border bg-transparent px-1.5 py-1 text-xs"
          value={cur}
          onChange={(e) => setCur(e.target.value as Code)}
        >
          <option value="VND">VND</option>
          <option value="KRW">KRW</option>
          <option value="USD">USD</option>
        </select>
        {err && (
          <span className="ml-1 text-[10px] text-amber-500">
            {err}
          </span>
        )}
      </div>
    );
  }

  // panel 모드 (기존 카드형)
  return (
    <div
      className={cn(
        "space-y-3 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-sm dark:border-slate-700 dark:bg-slate-900",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
            예산 현황
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            카테고리/일자별 예상 지출을 확인하세요.
          </p>
        </div>
        <select
          className="rounded-md border bg-transparent px-1.5 py-1 text-xs"
          value={cur}
          onChange={(e) => setCur(e.target.value as Code)}
        >
          <option value="VND">VND</option>
          <option value="KRW">KRW</option>
          <option value="USD">USD</option>
        </select>
      </div>

      <div className="flex items-baseline justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          총 예상 지출
        </span>
        <span className="font-semibold text-slate-900 dark:text-slate-50">
          {fmt(totalVND || 0)}
        </span>
      </div>

      {typeof budgetLimitVND === "number" && (
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            예산 한도
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-50">
            {fmt(budgetLimitVND)}
          </span>
        </div>
      )}

      <div className="space-y-1 pt-2">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          카테고리별
        </p>
        {Object.keys(byCategory).length === 0 && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            아직 등록된 비용이 없습니다.
          </p>
        )}
        {Object.entries(byCategory).map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between text-[11px]"
          >
            <span className="truncate text-slate-500 dark:text-slate-400">
              {k}
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-100">
              {fmt(v)}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-1 pt-2">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          날짜별
        </p>
        {Object.keys(byDate).length === 0 && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            아직 등록된 비용이 없습니다.
          </p>
        )}
        {Object.entries(byDate).map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between text-[11px]"
          >
            <span className="truncate text-slate-500 dark:text-slate-400">
              {k}
            </span>
            <span className="font-medium text-slate-800 dark:text-slate-100">
              {fmt(v)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function cn(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(" ");
}
