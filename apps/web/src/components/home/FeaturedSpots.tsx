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

const SpotCard = ({ spot }: { spot: Spot }) => (
  <div className="bg-surface dark:bg-surface/80 border border-border rounded-xl overflow-hidden shadow-card dark:shadow-depth transition-all hover:-translate-y-0.5 hover:shadow-hover">
    <img
      src={`${spot.imageUrl}&q=80&auto=format`}
      alt={spot.name}
      className="w-full h-48 object-cover"
      loading="lazy"
      decoding="async"
      sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
    />
    <div className="p-4">
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-text-main dark:text-text-main text-lg">
          {spot.name}
        </h3>
        <div className="flex items-center bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
          <FaStar className="mr-1" />
          <span>{spot.rating}</span>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {spot.tags.map((tag) => (
          <span
            key={tag}
            className="bg-background-sub dark:bg-surface/70 text-text-secondary dark:text-text-secondary text-xs font-semibold px-2.5 py-1 rounded-full"
          >
            #{tag}
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
    <section className="py-16 bg-background dark:bg-background-sub transition-colors">
      <h2 className="text-2xl font-bold text-text-main dark:text-text-main text-center mb-2">
        {title}
      </h2>
      <p className="text-text-secondary dark:text-text-secondary text-center mb-8 max-w-2xl mx-auto">
        {description}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {spots.map((spot) => (
          <SpotCard key={spot.id} spot={spot} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedSpots;
