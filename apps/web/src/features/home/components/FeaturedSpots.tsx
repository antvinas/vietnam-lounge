// src/features/home/components/FeaturedSpots.tsx
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

// 이미지가 없을 때 보여줄 기본 이미지 URL
const PLACEHOLDER_IMG = "https://via.placeholder.com/400x300/e2e8f0/94a3b8?text=Vietnam+Lounge";

const SpotCard = ({ spot }: { spot: Spot }) => (
  <div className="group relative overflow-hidden rounded-3xl border border-border bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-depth dark:bg-surface/80">
    {/* 이미지 영역: 비율 고정 및 줌인 효과 */}
    <div className="aspect-[4/3] overflow-hidden">
      <img
        src={`${spot.imageUrl}&q=80&auto=format`}
        alt={spot.name}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          e.currentTarget.src = PLACEHOLDER_IMG; // 이미지 로드 실패 시 대체 이미지로 교체
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