import { Link } from "react-router-dom";
import { FaStar, FaMoneyBillWave } from "react-icons/fa";
import type { Spot } from "@/types/spot";
import { getSpotPriceDisplay } from "@/constants/filters";

interface RelatedSpotsProps {
  spots: Spot[];
  mode: "explorer" | "nightlife";
}

const PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/axrWb8AAAAASUVORK5CYII=";

const getSafeId = (s: any) => s?.id || s?.firestoreId || s?._id || s?.slug || "";

const RelatedSpots = ({ spots, mode }: RelatedSpotsProps) => {
  const base = mode === "nightlife" ? "/adult/spots" : "/spots";
  const list = Array.isArray(spots) ? spots.slice(0, 4) : [];

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <h3 className="text-lg font-bold text-text-main">근처 추천 스팟</h3>
      <div className="mt-4 flex flex-col gap-4">
        {list.map((spot) => {
          const id = getSafeId(spot);
          const img = (spot as any).heroImage || (spot as any).imageUrl || (spot as any).imageUrls?.[0] || PLACEHOLDER;

          // ✅ 단일 소스: 예산 우선 → priceLevel fallback
          const price = getSpotPriceDisplay(spot as any);

          return (
            <Link
              to={`${base}/${id}`}
              key={id}
              className="group flex items-start gap-4 rounded-lg p-2 transition-colors hover:bg-background"
              aria-label={`${spot.name} 상세보기`}
            >
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                <img
                  src={img}
                  alt={spot.name}
                  loading="lazy"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    if (t.src !== PLACEHOLDER) t.src = PLACEHOLDER;
                  }}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="flex-1">
                <h4 className="font-semibold leading-tight text-text-main group-hover:text-primary">{spot.name}</h4>

                {spot.category && <p className="mt-1 text-sm text-text-secondary">{spot.category}</p>}

                {/* ✅ 예산/가격대 */}
                {price.primary ? (
                  <div className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
                    <FaMoneyBillWave className="text-gray-400" />
                    <span className="font-semibold text-text-main">{price.primary}</span>
                  </div>
                ) : null}

                <div className="mt-1.5 flex items-center gap-1 text-sm text-text-secondary">
                  <FaStar className="text-yellow-400" />
                  <span className="font-bold text-text-main">
                    {typeof spot.rating === "number" ? spot.rating.toFixed(1) : "0.0"}
                  </span>
                  <span>({(spot as any).reviewCount || 0})</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedSpots;
