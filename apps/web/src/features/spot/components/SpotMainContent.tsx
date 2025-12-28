// apps/web/src/features/spot/components/SpotMainContent.tsx
import React, { useMemo } from "react";
import type { Spot, SpotMenuItem } from "@/types/spot";
import SpotSummary from "@/features/spot/components/SpotSummary";
import SpotPrimaryCtas from "@/features/spot/components/SpotPrimaryCtas";
import CouponCard from "@/components/widgets/CouponCard";
import SpotSectionsByCategory from "@/features/spot/components/detail/SpotSectionsByCategory";
import SpotEmptyState from "@/features/spot/components/detail/SpotEmptyState";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { FaUtensils, FaCamera, FaInstagram, FaFacebook, FaMoneyBillWave } from "react-icons/fa";
import "react-photo-view/dist/react-photo-view.css";
import { getSpotPriceDisplay } from "@/constants/filters";

type Props = {
  spot: Spot;
  reviews?: any[];
  className?: string;
  mode?: "explorer" | "nightlife";
};

// 카테고리별 섹션 제목 매핑
const MENU_TITLE_MAP: Record<string, string> = {
  맛집: "대표 메뉴",
  카페: "음료 및 디저트",
  "호텔/리조트": "객실 요금",
  숙소: "숙박 요금",
  "스파/마사지": "관리 프로그램",
  액티비티: "이용 요금",
  관광지: "입장료",
  쇼핑: "주요 상품",
  클럽: "주류 및 테이블",
  "바/펍": "주류 메뉴",
  라운지: "테이블/최소소비",
  가라오케: "룸/세트",
};

export default function SpotMainContent({ spot, reviews = [], className = "" }: Props) {
  // 기본 연락처 정보
  const phone = spot.phone || (spot as any)?.contact?.phone;
  const website = spot.website || (spot as any)?.contact?.website;
  const bookingUrl = spot.bookingUrl;

  // 위치 좌표
  const lat = spot.latitude ?? spot.coordinates?.lat ?? spot.location?.lat;
  const lng = spot.longitude ?? spot.coordinates?.lng ?? spot.location?.lng;

  // 쿠폰 데이터
  const coupons: any[] = Array.isArray((spot as any)?.coupons) ? (spot as any).coupons : [];

  // ✅ 메뉴 데이터 추출
  const menuImages = spot.menuImages || [];
  const menuItems = spot.menuItems || spot.menus || (spot as any).menu || [];

  // ✅ SNS 링크 추출
  const social = spot.socialLinks;

  // 카테고리에 따른 섹션 제목 결정
  const menuSectionTitle = MENU_TITLE_MAP[spot.category || ""] || "메뉴 및 가격";

  const handleSuggest = () => {
    const title = encodeURIComponent(`[정보 제보] ${spot.name}`);
    const body = encodeURIComponent("부족한 정보와 근거 링크/사진을 적어주세요.");
    window.open(`mailto:hello@vietlounge.app?subject=${title}&body=${body}`, "_blank");
  };

  const price = useMemo(() => getSpotPriceDisplay(spot as any), [spot]);

  // 정보 부족 상태 판단
  const noInfo = useMemo(() => {
    const desc = spot.description || (spot as any)?.summary;
    const hasMenu = menuImages.length > 0 || menuItems.length > 0;
    const hasPrice = !!price.primary || !!(spot as any)?.priceRange || !!(spot as any)?.averageSpend;
    const hasHours = !!spot.openHours || !!(spot as any)?.openingHours;
    return !desc && !hasMenu && !hasPrice && !hasHours;
  }, [spot, menuImages, menuItems, price]);

  return (
    <article className={`space-y-8 ${className}`}>
      {/* 1. 주요 액션 (바로가기 + SNS) */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="mb-3 text-base font-bold text-slate-900 dark:text-slate-100">바로가기</h3>
            <SpotPrimaryCtas
              phone={phone}
              websiteUrl={website}
              bookingUrl={bookingUrl}
              lat={typeof lat === "number" ? lat : undefined}
              lng={typeof lng === "number" ? lng : undefined}
              spotName={spot.name}
              socialLinks={social}
            />
          </div>

          {/* SNS 링크 강조 */}
          {social && (social.instagram || social.facebook) && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-3">
              {social.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-lg text-sm font-bold hover:bg-pink-100 transition dark:bg-pink-900/20 dark:text-pink-400"
                >
                  <FaInstagram /> Instagram
                </a>
              )}
              {social.facebook && (
                <a
                  href={social.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition dark:bg-blue-900/20 dark:text-blue-400"
                >
                  <FaFacebook /> Facebook
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 2. 요약 정보 (소개, 태그, 시간, 편의시설) */}
      <SpotSummary spot={spot} onSuggestInfo={handleSuggest} />

      {/* 3. 메뉴 및 예산 정보 섹션 */}
      {(menuImages.length > 0 || menuItems.length > 0 || price.primary || (spot as any)?.averageSpend) && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FaUtensils className="text-orange-500" /> {menuSectionTitle}
          </h3>

          <div className="space-y-6">
            {/* ✅ 예산/가격대(공통 규칙) */}
            {price.primary ? (
              <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-800 px-4 py-2 rounded-xl text-sm font-bold dark:bg-orange-900/30 dark:text-orange-200">
                <FaMoneyBillWave /> {price.primary}
              </div>
            ) : (spot as any)?.averageSpend ? (
              <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-800 px-4 py-2 rounded-xl text-sm font-bold dark:bg-orange-900/30 dark:text-orange-200">
                💰 1인당 평균 {(spot as any).averageSpend}
              </div>
            ) : null}

            {price.secondary ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">{price.secondary}</p>
            ) : null}

            {/* 메뉴판 이미지 */}
            {menuImages.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Photo Menu</p>
                <PhotoProvider>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-600">
                    {menuImages.map((img, idx) => (
                      <PhotoView key={idx} src={img}>
                        <div className="relative flex-shrink-0 w-32 h-44 rounded-xl overflow-hidden cursor-pointer group border border-slate-200 dark:border-slate-700">
                          <img src={img} alt={`menu-${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <FaCamera />
                          </div>
                        </div>
                      </PhotoView>
                    ))}
                  </div>
                </PhotoProvider>
              </div>
            )}

            {/* 텍스트 메뉴 리스트 */}
            {menuItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">List</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {menuItems.map((item: SpotMenuItem, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="block font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{item.name}</span>
                        {item.description && (
                          <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {item.description}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-orange-600 dark:text-orange-400 text-sm whitespace-nowrap">{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. 카테고리별 추가 정보 */}
      <SpotSectionsByCategory spot={spot} />

      {/* 5. 쿠폰 섹션 */}
      {coupons.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">사용 가능한 쿠폰</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coupons.map((c, i) => (
              <CouponCard key={c.id || i} coupon={c} />
            ))}
          </div>
        </section>
      )}

      {/* 6. 리뷰 하이라이트 */}
      {reviews.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/40">
          <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">리뷰 하이라이트</h3>
          <ul className="space-y-3">
            {reviews.slice(0, 3).map((r: any, i: number) => (
              <li
                key={r.id || i}
                className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl text-sm text-slate-700 dark:text-slate-300"
              >
                "{r.content}"
                <div className="mt-1 text-xs text-slate-400 font-medium">- {r.userName || r.nickname || "익명"}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 7. 정보 없음 (Empty State) */}
      {noInfo && (
        <SpotEmptyState
          title="아직 상세 정보가 부족해요"
          description="가격, 메뉴, 영업시간 등의 정보가 없습니다. 알고 계신다면 제보해주세요!"
          onCta={handleSuggest}
        />
      )}
    </article>
  );
}
