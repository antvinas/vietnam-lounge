import React, { useMemo } from "react";
import type { Spot } from "@/types/spot";
import SpotSummary from "@/components/spots/SpotSummary";
import SpotPrimaryCtas from "@/components/spots/SpotPrimaryCtas";
import CouponCard from "@/components/widgets/CouponCard";
import SpotSectionsByCategory from "@/components/spots/detail/SpotSectionsByCategory";
import SpotEmptyState from "@/components/spots/detail/SpotEmptyState";

type Props = {
  spot: Spot;
  reviews?: any[];
  className?: string;
  mode?: "explorer" | "nightlife";
};

export default function SpotMainContent({ spot, reviews = [], className = "" }: Props) {
  const phone = (spot as any)?.phone || (spot as any)?.contact?.phone;
  const website = (spot as any)?.website || (spot as any)?.contact?.website;
  const bookingUrl = (spot as any)?.bookingUrl;

  const lat =
    (spot as any)?.latitude ?? (spot as any)?.coordinates?.lat ?? (spot as any)?.location?.lat;

  const lng =
    (spot as any)?.longitude ?? (spot as any)?.coordinates?.lng ?? (spot as any)?.location?.lng;

  const coupons: any[] = Array.isArray((spot as any)?.coupons) ? (spot as any).coupons : [];

  const handleSuggest = () => {
    const title = encodeURIComponent(`[정보 제보] ${(spot as any)?.name}`);
    const body = encodeURIComponent("부족한 정보와 근거 링크/사진을 적어주세요.");
    window.open(`mailto:hello@vietlounge.app?subject=${title}&body=${body}`, "_blank");
  };

  const noInfo = useMemo(() => {
    const desc = (spot as any)?.description || (spot as any)?.summary;
    const am = Array.isArray((spot as any)?.amenities) && (spot as any)?.amenities.length > 0;
    const pol =
      (spot as any)?.priceRange ||
      (spot as any)?.checkInOut ||
      (spot as any)?.paymentMethods ||
      (spot as any)?.parkingPolicy ||
      (spot as any)?.childPolicy ||
      (spot as any)?.petPolicy ||
      (spot as any)?.smokingPolicy ||
      (spot as any)?.cancellationPolicy;
    const hours = (spot as any)?.openingHours || (spot as any)?.hours;
    return !desc && !am && !pol && !hours;
  }, [spot]);

  return (
    <article className={`space-y-6 ${className}`}>
      {/* 주요 CTA */}
      <section className="rounded-3xl border border-slate-700 bg-slate-800/40 p-4">
        <h3 className="mb-3 text-base font-semibold text-slate-100">바로가기</h3>
        <SpotPrimaryCtas
          phone={phone}
          websiteUrl={website}
          bookingUrl={bookingUrl}
          lat={typeof lat === "number" ? lat : undefined}
          lng={typeof lng === "number" ? lng : undefined}
          spotName={(spot as any)?.name}
        />
      </section>

      {/* 소개 + 태그 + 영업시간 + 서비스 + 정책 */}
      <SpotSummary spot={spot} onSuggestInfo={handleSuggest} />

      {/* 카테고리별 섹션 */}
      <SpotSectionsByCategory spot={spot} />

      {/* 쿠폰 */}
      {coupons.length > 0 && (
        <section className="rounded-3xl border border-slate-700 bg-slate-800/40 p-4">
          <h3 className="mb-3 text-base font-semibold text-slate-100">쿠폰</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coupons.map((c, i) => (
              <CouponCard key={c.id || i} coupon={c} />
            ))}
          </div>
        </section>
      )}

      {/* 리뷰 하이라이트 */}
      {reviews.length > 0 && (
        <section className="rounded-3xl border border-slate-700 bg-slate-800/40 p-4">
          <h3 className="mb-2 text-base font-semibold text-slate-100">리뷰 하이라이트</h3>
          <ul className="list-disc pl-5 text-sm text-slate-200 space-y-1">
            {reviews.slice(0, 3).map((r: any, i: number) => (
              <li key={r.id || i} className="line-clamp-2">{r.content}</li>
            ))}
          </ul>
        </section>
      )}

      {/* 완전 빈 상태 */}
      {noInfo && (
        <SpotEmptyState
          title="정보가 거의 없습니다"
          description="가격대·영업시간·메뉴 등 핵심 정보가 비어 있습니다. 제보해 주시면 반영하겠습니다."
          onCta={handleSuggest}
        />
      )}
    </article>
  );
}
