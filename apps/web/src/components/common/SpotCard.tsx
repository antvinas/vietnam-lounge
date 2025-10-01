import { Link, useNavigate } from "react-router-dom";
import { FaStar, FaMapMarkerAlt, FaTicketAlt, FaShareAlt } from "react-icons/fa";
import type { Spot } from "@/types/spot";
import useUiStore from "@/store/ui.store";
import CouponBadge from "../spots/CouponBadge";

// 태그 색상 매핑
const getTagClasses = (category: string, mode: "explorer" | "nightlife") => {
  const k = category.toLowerCase();
  const isExplorer = mode === "explorer";
  const colorMap: Record<string, { explorer: string; nightlife: string }> = {
    food: { explorer: "bg-mint-100 text-mint-800", nightlife: "bg-mint-900/50 text-mint-300" },
    cafe: { explorer: "bg-mint-100 text-mint-800", nightlife: "bg-mint-900/50 text-mint-300" },
    tour: { explorer: "bg-orange-100 text-orange-800", nightlife: "bg-orange-900/50 text-orange-300" },
    culture: { explorer: "bg-orange-100 text-orange-800", nightlife: "bg-orange-900/50 text-orange-300" },
    spa: { explorer: "bg-purple-100 text-purple-800", nightlife: "bg-purple-900/50 text-purple-300" },
    wellness: { explorer: "bg-purple-100 text-purple-800", nightlife: "bg-purple-900/50 text-purple-300" },
    nightlife: { explorer: "bg-pink-100 text-pink-800", nightlife: "bg-pink-900/50 text-pink-300" },
    shopping: { explorer: "bg-blue-100 text-blue-800", nightlife: "bg-blue-900/50 text-blue-300" },
  };
  for (const key in colorMap) {
    if (k.includes(key)) return isExplorer ? colorMap[key].explorer : colorMap[key].nightlife;
  }
  return isExplorer ? "bg-gray-100 text-gray-800" : "bg-gray-700 text-gray-300";
};

interface Props {
  spot: Spot;
  isHighlighted?: boolean;
}

const SpotCard = ({ spot, isHighlighted = false }: Props) => {
  const { contentMode } = useUiStore();
  const navigate = useNavigate();
  const rating = typeof spot.rating === "number" ? spot.rating.toFixed(1) : "—";
  const reviewCount = spot.reviewCount ?? 0;

  const primaryButtonClass =
    contentMode === "explorer"
      ? "bg-[#2BB6C5] text-white hover:bg-[#26A3B2]"
      : "bg-[#8B5CF6] text-white hover:bg-[#7C3AED]";

  const secondaryButtonClass =
    contentMode === "explorer"
      ? "border-[#2BB6C5]/30 text-[#2BB6C5] hover:bg-[#2BB6C5]/10"
      : "border-[#8B5CF6]/35 text-[#C4B5FD] hover:bg-[#8B5CF6]/10";

  const infoText = spot.priceRange || spot.averageSpend || spot.operatingHours || "정보 준비중";
  const distanceKm = typeof spot.distanceKm === "number" ? spot.distanceKm : null;

  const mapLink =
    spot.mapUrl ||
    (typeof spot.latitude === "number" && typeof spot.longitude === "number"
      ? `https://www.google.com/maps?q=${spot.latitude},${spot.longitude}`
      : null);

  const primaryLabel = spot.bookingUrl ? "예약하기" : "상세 보기";

  const handleShare = () => {
    const shareData = {
      title: spot.name,
      text: `${spot.name} 추천 스팟`,
      url: `${window.location.origin}/spots/${spot.id}`,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareData.url);
      alert("링크가 복사되었습니다!");
    }
  };

  return (
    <article
      className={`group relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-3xl bg-surface shadow-lg transition-all duration-200 ${
        isHighlighted
          ? "ring-2 ring-primary scale-[1.02]"
          : "hover:-translate-y-1 hover:shadow-2xl"
      }`}
      aria-label={`${spot.name} 카드`}
      tabIndex={0}
    >
      {/* 이미지 */}
      <div className="aspect-[16/9] w-full overflow-hidden">
        <Link
          to={`/spots/${spot.id}`}
          aria-label={`${spot.name} 상세로 이동`}
          className="block h-full w-full focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <img
            src={
              spot.imageUrl ||
              `https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=60`
            }
            alt={`${spot.name} 대표 이미지`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
      </div>

      {/* 콘텐츠 */}
      <div className="flex flex-1 flex-col p-5">
        {/* 상태 배지 */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {spot.hasCoupon && (
            <CouponBadge icon={<FaTicketAlt />} label="쿠폰" tone={contentMode} />
          )}
          {spot.isOpenNow && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              영업중
            </span>
          )}
          {distanceKm !== null && (
            <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium text-text-secondary dark:bg-white/10">
              {distanceKm >= 1 ? distanceKm.toFixed(1) : distanceKm.toFixed(2)}km
            </span>
          )}
        </div>

        {/* 타이틀/평점/주소 */}
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-[19px] font-semibold leading-snug text-text-main">
            <Link to={`/spots/${spot.id}`} className="hover:underline underline-offset-2">
              {spot.name}
            </Link>
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-text-secondary">
            <div className="flex items-center gap-1">
              <FaStar className="text-yellow-400" aria-hidden />
              <span className="font-semibold text-text-main">{rating}</span>
              <span className="text-text-secondary">({reviewCount})</span>
            </div>
            {spot.address && (
              <div className="flex min-w-0 items-center gap-1">
                <FaMapMarkerAlt className="opacity-70" aria-hidden />
                <span className="truncate">{spot.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* 태그 */}
        <div className="mt-3 flex flex-wrap gap-2">
          {(spot.tags || []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-3 py-1 text-[13px] font-medium ${getTagClasses(
                tag,
                contentMode
              )} whitespace-nowrap`}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-auto border-t border-border pt-4">
          <p className="mb-4 text-sm font-medium text-text-secondary">{infoText}</p>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              className={`h-11 w-full min-w-[120px] rounded-xl px-5 text-[15px] font-semibold transition-colors sm:w-auto ${primaryButtonClass}`}
              onClick={(event) => {
                if (spot.bookingUrl) {
                  event.preventDefault();
                  window.open(spot.bookingUrl, "_blank", "noopener");
                } else {
                  navigate(`/spots/${spot.id}`);
                }
              }}
            >
              {primaryLabel}
            </button>

            <div className="flex w-full flex-row flex-wrap gap-2 sm:w-auto">
              {mapLink && (
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`h-11 flex-1 min-w-[110px] rounded-xl border px-4 text-[14px] font-semibold transition-colors sm:flex-initial ${secondaryButtonClass}`}
                >
                  길찾기
                </a>
              )}
              <button
                type="button"
                className="h-11 flex-1 min-w-[110px] rounded-xl border border-border px-4 text-[14px] font-medium text-text-main transition-colors hover:bg-black/5 dark:hover:bg-white/10 sm:flex-initial"
                onClick={handleShare}
              >
                <FaShareAlt className="inline mr-2" /> 공유하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default SpotCard;
