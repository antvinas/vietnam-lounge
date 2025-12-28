// apps/web/src/features/spot/components/SpotPolicies.tsx
import React, { useMemo } from "react";
import type { PriceLevel } from "@/constants/filters";
import { getSpotPriceDisplay } from "@/constants/filters";

export type SpotPoliciesProps = {
  /** (Legacy) 문자열 or range 객체 */
  priceRange?: string | { min?: number; max?: number; currency?: string };

  /** ✅ New: 표시용 예산/가격대 */
  budget?: number;
  budgetUnit?: string;
  budgetText?: string;
  priceLevel?: PriceLevel;

  checkInOut?: { checkIn?: string; checkOut?: string };
  paymentMethods?: string[]; // 예: ["현금","카드","QR","VNPay"]
  parking?: string; // 예: "무료 주차", "유료 주차"
  childPolicy?: string;
  petPolicy?: string;
  smokingPolicy?: string; // 예: "전 구역 금연", "흡연실 있음"
  cancellation?: string;
  className?: string;
};

function toLegacyPrice(p?: SpotPoliciesProps["priceRange"]) {
  if (!p) return undefined;
  if (typeof p === "string") return p;
  const cur = p.currency ?? "₫";
  const f = (n?: number) =>
    typeof n === "number" ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : undefined;
  if (p.min && p.max) return `${cur}${f(p.min)} ~ ${cur}${f(p.max)}`;
  if (p.min) return `최소 ${cur}${f(p.min)}`;
  if (p.max) return `최대 ${cur}${f(p.max)}`;
  return undefined;
}

const Row: React.FC<{ label: string; value?: React.ReactNode; sub?: React.ReactNode }> = ({ label, value, sub }) => {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2">
      <div className="text-sm text-slate-400">{label}</div>
      <div className="text-sm text-slate-200">
        <div>{value}</div>
        {sub ? <div className="mt-1 text-xs text-slate-400">{sub}</div> : null}
      </div>
    </div>
  );
};

export default function SpotPolicies({
  priceRange,
  budget,
  budgetUnit,
  budgetText,
  priceLevel,
  checkInOut,
  paymentMethods,
  parking,
  childPolicy,
  petPolicy,
  smokingPolicy,
  cancellation,
  className = "",
}: SpotPoliciesProps) {
  const legacyPriceText = useMemo(() => toLegacyPrice(priceRange), [priceRange]);

  const priceDisplay = useMemo(() => {
    // ✅ 공통 규칙: 예산(budget+unit) 우선 → priceLevel fallback
    const display = getSpotPriceDisplay({ budget, budgetUnit, budgetText, priceLevel });

    // 레거시만 있고 새 필드가 없을 때만 legacy를 보여주도록
    if (display.source === "none" && legacyPriceText) {
      return { primary: legacyPriceText, secondary: "", source: "legacy" as const };
    }
    return display;
  }, [budget, budgetUnit, budgetText, priceLevel, legacyPriceText]);

  const checkInOutText =
    checkInOut?.checkIn || checkInOut?.checkOut
      ? `${checkInOut?.checkIn ? `체크인 ${checkInOut.checkIn}` : ""}${
          checkInOut?.checkIn && checkInOut?.checkOut ? " · " : ""
        }${checkInOut?.checkOut ? `체크아웃 ${checkInOut.checkOut}` : ""}`
      : undefined;

  const payText = paymentMethods?.length ? paymentMethods.join(", ") : undefined;

  const empty =
    !priceDisplay.primary &&
    !checkInOutText &&
    !payText &&
    !parking &&
    !childPolicy &&
    !petPolicy &&
    !smokingPolicy &&
    !cancellation;

  if (empty) {
    return (
      <div className={className}>
        <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
          <p className="text-sm text-slate-300">정책 및 가격 정보가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <section className={`rounded-2xl border border-slate-700 bg-slate-800/40 p-4 ${className}`} aria-label="정책 및 가격">
      <h3 className="mb-3 text-base font-semibold text-slate-100">정책 · 가격</h3>
      <div>
        {/* ✅ 예산/가격대(신규) */}
        <Row
          label={priceDisplay.source === "budget" ? "예산" : "가격대"}
          value={priceDisplay.primary || undefined}
          sub={priceDisplay.secondary || undefined}
        />

        {/* 나머지 정책 */}
        <Row label="체크인/아웃" value={checkInOutText} />
        <Row label="결제수단" value={payText} />
        <Row label="주차" value={parking} />
        <Row label="아동 정책" value={childPolicy} />
        <Row label="반려동물" value={petPolicy} />
        <Row label="흡연" value={smokingPolicy} />
        <Row label="취소/환불" value={cancellation} />
      </div>
    </section>
  );
}
