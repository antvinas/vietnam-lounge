import { motion } from "framer-motion";
import { useMemo } from "react";
import { FaStar, FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import type { Spot } from "@/types/spot";
import useUiStore from "@/store/ui.store";
import { getSpotPriceDisplay } from "@/constants/filters";

interface SpotCardProps {
  spot: Spot;
  featured?: boolean;
  onClick?: (id: string) => void;
  onHover?: (id: string | null) => void;
}

const SpotCard = ({ spot, featured = false, onClick, onHover }: SpotCardProps) => {
  const navigate = useNavigate();
  const { contentMode } = useUiStore();
  const isNight = contentMode === "nightlife";

  const cover = useMemo(() => {
    const first = spot.images?.[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "url" in first) return (first as any).url as string;
    return (spot as any)?.heroImage || (spot as any)?.imageUrl || (spot as any)?.imageUrls?.[0] || "/placeholders/spot.jpg";
  }, [spot]);

  // ✅ 단일 소스: 예산 우선 → priceLevel fallback
  const priceDisplay = useMemo(() => getSpotPriceDisplay(spot as any), [spot]);

  const handleClick = () => {
    if (onClick) onClick(spot.id);
    const base = isNight ? "/adult/spots" : "/spots";
    navigate(`${base}/${spot.id}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      className={`group cursor-pointer flex flex-col gap-3 ${featured ? "md:col-span-2 md:row-span-2" : ""}`}
      onClick={handleClick}
      onMouseEnter={() => onHover?.(spot.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* 1. 이미지 영역 */}
      <div className={`relative overflow-hidden rounded-2xl bg-gray-200 dark:bg-gray-800 ${featured ? "aspect-video" : "aspect-[4/3]"}`}>
        <img
          src={cover}
          alt={spot.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
          loading="lazy"
        />
        {/* 카테고리 뱃지 */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 bg-white/90 dark:bg-black/80 backdrop-blur-md text-gray-900 dark:text-white text-[11px] font-bold rounded-lg shadow-sm tracking-tight">
            {spot.category}
          </span>
        </div>
      </div>

      {/* 2. 텍스트 영역 */}
      <div className="px-1">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h3
            className={`font-bold text-gray-900 dark:text-white leading-tight group-hover:text-primary transition-colors ${
              featured ? "text-2xl" : "text-lg"
            }`}
          >
            {spot.name}
          </h3>

          {spot.rating ? (
            <div className="flex items-center gap-1 text-xs font-bold bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-900 dark:text-white shrink-0">
              <FaStar className="text-yellow-400" size={10} />
              {spot.rating.toFixed(1)}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          <FaMapMarkerAlt size={12} className="shrink-0" />
          <span className="truncate">
            {spot.region || (spot as any)?.locationId || "Vietnam"} {spot.address ? `· ${spot.address}` : ""}
          </span>
        </div>

        {/* ✅ 예산/가격대 표시 라인 */}
        {priceDisplay.primary ? (
          <div className="mt-1.5">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{priceDisplay.primary}</div>
            {priceDisplay.secondary ? (
              <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{priceDisplay.secondary}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
};

export default SpotCard;
