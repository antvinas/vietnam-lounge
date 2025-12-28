import React from "react";
import useUiStore from "@/store/ui.store";
import { FaStar } from "react-icons/fa";

interface Spot {
  id: number;
  name: string;
  tags: string[];
  rating: number;
  imageUrl: string;
}

interface FeaturedSpotsProps {
  spots: Spot[];
}

// ✅ DNS 이슈 없는 인라인 SVG placeholder (data-uri)
const PLACEHOLDER_IMG = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#e2e8f0"/>
        <stop offset="100%" stop-color="#cbd5e1"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          font-family="Arial, sans-serif" font-size="36" fill="#64748b">
      Vietnam Lounge
    </text>
  </svg>
`)}`;

function buildImageUrl(url?: string) {
  const u = (url || "").trim();
  if (!u) return PLACEHOLDER_IMG;

  // Unsplash 이미지면 최적화 파라미터를 안전하게 붙여줌
  const isUnsplash = u.includes("images.unsplash.com") || u.includes("unsplash.com/photo");
  if (!isUnsplash) return u;

  const hasQuery = u.includes("?");
  const joiner = hasQuery ? "&" : "?";

  // 이미 들어있으면 중복 추가 안 함
  const hasAuto = u.includes("auto=format");
  const hasQ = u.includes("q=");
  const hasFit = u.includes("fit=");
  const hasW = u.includes("w=");

  const params = [
    !hasAuto ? "auto=format" : "",
    !hasFit ? "fit=crop" : "",
    !hasW ? "w=900" : "",
    !hasQ ? "q=80" : "",
  ].filter(Boolean);

  return params.length ? `${u}${joiner}${params.join("&")}` : u;
}

const SpotCard = ({ spot }: { spot: Spot }) => {
  const src = buildImageUrl(spot.imageUrl);

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-depth dark:bg-surface/80">
      {/* 이미지 영역: 비율 고정 및 줌인 효과 */}
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={src}
          alt={spot.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            // ✅ 무한 루프 방지
            e.currentTarget.onerror = null;
            e.currentTarget.src = PLACEHOLDER_IMG;
          }}
        />
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-text-main group-hover:text-emerald-600 transition-colors dark:text-text-main dark:group-hover:text-emerald-400">
            {spot.name}
          </h3>
          <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full dark:bg-yellow-900/30 dark:text-yellow-400">
            <FaStar className="text-[10px]" />
            <span>{spot.rating}</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {spot.tags.map((tag) => (
            <span
              key={tag}
              className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-gray-800 dark:text-gray-300"
            >
              #{tag.replace("#", "")}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const FeaturedSpots: React.FC<FeaturedSpotsProps> = ({ spots }) => {
  const { contentMode } = useUiStore();
  const isNightlife = contentMode === "nightlife";

  const title = isNightlife ? "🔥 Hot Nightlife" : "🏞️ Top Spots";
  const description = isNightlife
    ? "지금 가장 인기 있는 나이트라이프 스팟을 확인해보세요."
    : "베트남 최고의 명소와 액티비티를 놓치지 마세요.";

  return (
    <section className="py-8 bg-transparent transition-colors">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-text-main dark:text-text-main mb-3 tracking-tight">
          {title}
        </h2>
        <p className="text-text-secondary dark:text-text-secondary max-w-2xl mx-auto text-sm sm:text-base">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {spots.map((spot) => (
          <SpotCard key={spot.id} spot={spot} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedSpots;
