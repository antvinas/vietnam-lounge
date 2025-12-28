import React, { useMemo } from "react";
import type { Spot } from "@/types/spot";
import SpotAmenities from "@/features/spot/components/SpotAmenities";
import SpotPolicies from "@/features/spot/components/SpotPolicies";
import SpotTags from "@/features/spot/components/SpotTags";

type Props = {
  spot: Spot;
  className?: string;
  onSuggestInfo?: () => void;
};

type OpeningHours =
  | {
      [weekday in "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"]?:
        | { open: string; close: string }
        | "closed";
    }
  | Array<{ day: string; open?: string; close?: string; closed?: boolean }>;

function OpeningHoursBlock({ hours }: { hours?: OpeningHours }) {
  if (!hours) return null;

  const rows = Array.isArray(hours)
    ? hours.map((h) => ({
        day: h.day,
        text: h.closed ? "휴무" : h.open && h.close ? `${h.open}–${h.close}` : "정보 없음",
      }))
    : (["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const).map((d) => {
        const v = (hours as any)[d];
        const nameMap: Record<string, string> = {
          mon: "월",
          tue: "화",
          wed: "수",
          thu: "목",
          fri: "금",
          sat: "토",
          sun: "일",
        };
        if (!v) return { day: nameMap[d], text: "정보 없음" };
        if (v === "closed") return { day: nameMap[d], text: "휴무" };
        return { day: nameMap[d], text: `${v.open ?? "?"}–${v.close ?? "?"}` };
      });

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
      <h3 className="mb-2 text-base font-semibold text-slate-100">영업시간</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{r.day}</span>
            <span className="text-slate-200">{r.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SpotSummary({ spot, className = "", onSuggestInfo }: Props) {
  const desc = (spot as any)?.description || (spot as any)?.summary;

  const tags: string[] = useMemo(
    () =>
      ([...((spot as any)?.tags ?? []), (spot as any)?.category, (spot as any)?.subCategory].filter(Boolean) as string[]),
    [spot]
  );

  const amenities: string[] = useMemo(() => (((spot as any)?.amenities ?? []) as string[]).filter(Boolean), [spot]);

  const policies = useMemo(
    () => ({
      // Legacy
      priceRange: (spot as any)?.priceRange,

      // ✅ New
      budget: (spot as any)?.budget,
      budgetUnit: (spot as any)?.budgetUnit,
      budgetText: (spot as any)?.budgetText,
      priceLevel: (spot as any)?.priceLevel,

      // policies
      checkInOut: (spot as any)?.checkInOut,
      paymentMethods: (spot as any)?.paymentMethods,
      parking: (spot as any)?.parkingPolicy,
      childPolicy: (spot as any)?.childPolicy,
      petPolicy: (spot as any)?.petPolicy,
      smokingPolicy: (spot as any)?.smokingPolicy,
      cancellation: (spot as any)?.cancellationPolicy,
    }),
    [spot]
  );

  const openingHours: OpeningHours | undefined = (spot as any)?.openingHours || (spot as any)?.hours;

  const isEmptyPolicies =
    !policies.priceRange &&
    !policies.budget &&
    !policies.budgetUnit &&
    !policies.budgetText &&
    !policies.priceLevel &&
    !policies.checkInOut &&
    !policies.paymentMethods &&
    !policies.parking &&
    !policies.childPolicy &&
    !policies.petPolicy &&
    !policies.smokingPolicy &&
    !policies.cancellation;

  const hasAnyContent = !!desc || tags.length > 0 || amenities.length > 0 || openingHours || !isEmptyPolicies;

  return (
    <section className={`space-y-6 ${className}`}>
      {/* 소개 */}
      <article className="rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
        <h3 className="mb-2 text-base font-semibold text-slate-100">소개</h3>
        {desc ? (
          <p className="whitespace-pre-line text-sm leading-7 text-slate-200">{desc}</p>
        ) : (
          <div className="flex items-center justify-between text-sm">
            <p className="text-slate-300">소개가 아직 없습니다.</p>
            {onSuggestInfo && (
              <button
                onClick={onSuggestInfo}
                className="rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-100 hover:bg-slate-700/40"
              >
                정보 제보
              </button>
            )}
          </div>
        )}
      </article>

      {/* 태그 */}
      <SpotTags tags={tags} region={(spot as any)?.region} city={(spot as any)?.city} />

      {/* 영업시간 */}
      <OpeningHoursBlock hours={openingHours} />

      {/* 서비스/편의 */}
      <SpotAmenities amenities={amenities} onSuggestInfo={onSuggestInfo} className="pt-1" />

      {/* 정책/가격 */}
      <SpotPolicies
        className="pt-1"
        priceRange={policies.priceRange}
        budget={policies.budget}
        budgetUnit={policies.budgetUnit}
        budgetText={policies.budgetText}
        priceLevel={policies.priceLevel}
        checkInOut={policies.checkInOut}
        paymentMethods={policies.paymentMethods}
        parking={policies.parking}
        childPolicy={policies.childPolicy}
        petPolicy={policies.petPolicy}
        smokingPolicy={policies.smokingPolicy}
        cancellation={policies.cancellation}
      />

      {/* 완전 빈 상태 가드 */}
      {!hasAnyContent && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-4 text-sm text-slate-300">
          아직 등록된 정보가 거의 없습니다. 필요한 정보가 있다면 상단의 ‘정보 제보’를 눌러 알려주세요.
        </div>
      )}
    </section>
  );
}
