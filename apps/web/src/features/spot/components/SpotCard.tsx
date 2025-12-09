// src/components/spots/SpotCard.tsx
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import Badge from "@/components/common/Badge";
import type { Spot } from "@/types/spot";
import "@/styles/index.css";

interface Props {
  spot: Spot;
  isHighlighted?: boolean;
}

const PLACEHOLDER = import.meta.env.BASE_URL + "placeholders/spot.jpg";

/**
 * 카드 이미지: aspect-[4/3] + width/height로 CLS 예방
 * 리스트 썸네일: lazy + sizes 힌트
 * 참고: 이미지에 고정 치수를 제공하면 브라우저가 비율을 선점한다. :contentReference[oaicite:1]{index=1}
 */
const SpotCard = ({ spot, isHighlighted = false }: Props) => {
  const safeId =
    (spot as any)?.id ||
    (spot as any)?.firestoreId ||
    (spot as any)?._id ||
    (spot as any)?.slug ||
    "";

  const mode = (spot as any).mode;
  const base = mode === "nightlife" || mode === "adult" ? "/adult/spots" : "/spots";
  const link = `${base}/${safeId}`;

  const cover =
    (spot as any).heroImage ||
    (spot as any).imageUrl ||
    (spot as any).imageUrls?.[0] ||
    PLACEHOLDER;

  const priceText = (spot as any)?.priceRange ? String((spot as any).priceRange) : undefined;

  return (
    <Link
      to={link}
      className={`group block overflow-hidden rounded-3xl border border-border bg-surface dark:bg-surface/80 shadow-card dark:shadow-depth ring-1 ring-border/60 transition-all hover:-translate-y-1 hover:shadow-hover dark:hover:shadow-depth-lg relative ${isHighlighted ? "ring-2 ring-primary" : ""} ${spot.isSponsored ? "premium-glow" : ""}`}
      aria-label={`${spot.name} 상세보기`}
      role="article"
    >
      {spot.isSponsored && (
        <div className="absolute left-3 top-3 z-20 sponsor-badge" aria-label="스폰서">
          {(spot as any).sponsorLabel || "스폰서"}
        </div>
      )}

      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={cover}
          onError={(e) => {
            const t = e.currentTarget as HTMLImageElement;
            if (t.src !== PLACEHOLDER) t.src = PLACEHOLDER;
          }}
          alt={`${spot.name} 대표 이미지`}
          loading="lazy"
          decoding="async"
          sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
          width={1200}
          height={900}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {spot.city && (
          <span className="absolute left-3 bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
            {spot.city}
          </span>
        )}
        {(spot as any).isAiRecommended && (
          <Badge text="AI 추천" color="primary" className="absolute right-3 top-3" />
        )}
        {(spot as any).isEditorPick && (
          <Badge text="Editor’s Pick" color="secondary" className="absolute right-3 top-3" />
        )}
      </div>

      <div className="p-5">
        <h3 className="truncate text-lg font-bold text-text-main dark:text-text-main group-hover:text-primary">
          {spot.name}
        </h3>

        <p className="mt-1 truncate text-sm text-text-secondary dark:text-text-secondary">
          {[spot.category, priceText].filter(Boolean).join(" · ")}
        </p>

        <div className="mt-3 flex items-center gap-1" aria-label="평점">
          <FaStar className="text-yellow-400" />
          <span className="font-semibold text-text-main dark:text-text-main">
            {typeof (spot as any).rating === "number" ? (spot as any).rating.toFixed(1) : "N/A"}
          </span>
        </div>

        {spot.description && (
          <p className="mt-3 line-clamp-2 text-sm text-text-secondary dark:text-text-secondary">
            {spot.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-primary dark:text-primary">자세히 보기 →</span>
        </div>
      </div>
    </Link>
  );
};

export default SpotCard;
