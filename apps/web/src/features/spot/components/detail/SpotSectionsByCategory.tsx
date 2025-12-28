import type { Spot } from "@/types/spot";
import { getSpotPriceDisplay } from "@/constants/filters";

type Props = { spot: Spot; className?: string };

export default function SpotSectionsByCategory({ spot, className = "" }: Props) {
  const c = String((spot as any)?.category || "").toLowerCase();

  const isRestaurant = /(restaurant|food|cafe|카페|레스토랑|식당|음식|맛집)/.test(c);
  const isBar = /(bar|pub|nightclub|바|펍|클럽|라운지)/.test(c);
  const isHotel = /(hotel|숙소|호텔|리조트)/.test(c);

  const price = getSpotPriceDisplay(spot as any);
  const legacyPriceRange = String((spot as any)?.priceRange ?? "").trim();

  const priceLine = price.primary || legacyPriceRange || "";

  return (
    <section className={`space-y-6 ${className}`}>
      {(isRestaurant || isBar) && (
        <article className="rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
          <h3 className="mb-2 text-base font-semibold text-slate-100">메뉴 · 예산</h3>

          {priceLine ? (
            <p className="text-sm text-slate-200">{priceLine}</p>
          ) : (
            <p className="text-sm text-slate-300">예산/가격대 정보 없음</p>
          )}

          {price.secondary ? <p className="mt-2 text-xs text-slate-400">{price.secondary}</p> : null}

          {(spot as any)?.menuUrl ? (
            <a
              href={(spot as any).menuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
            >
              메뉴판 보기 →
            </a>
          ) : (
            <p className="mt-2 text-sm text-slate-300">메뉴판 링크가 없습니다.</p>
          )}

          {Array.isArray((spot as any)?.recommendedMenu) && (spot as any).recommendedMenu.length > 0 && (
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-200">
              {(spot as any).recommendedMenu.map((m: string, i: number) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          )}
        </article>
      )}

      {isHotel && (
        <article className="rounded-2xl border border-slate-700 bg-slate-800/40 p-4">
          <h3 className="mb-2 text-base font-semibold text-slate-100">체크인 · 체크아웃 · 요금/정책</h3>

          {priceLine ? (
            <p className="text-sm text-slate-200">{priceLine}</p>
          ) : (
            <p className="text-sm text-slate-300">요금/가격대 정보 없음</p>
          )}

          {price.secondary ? <p className="mt-2 text-xs text-slate-400">{price.secondary}</p> : null}

          <p className="mt-3 text-sm text-slate-200">{(spot as any)?.checkInOut || "체크인/체크아웃 정보 없음"}</p>
          <p className="mt-2 text-sm text-slate-300">{(spot as any)?.cancellationPolicy || "취소/환불 정책 미등록"}</p>

          {(spot as any)?.bookingUrl && (
            <a
              href={(spot as any).bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
            >
              예약 페이지 열기 →
            </a>
          )}
        </article>
      )}
    </section>
  );
}
