import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import type { Spot } from "@/types/spot";

interface RelatedSpotsProps {
  spots: Spot[];
  mode: "explorer" | "nightlife";
}

const RelatedSpots = ({ spots }: RelatedSpotsProps) => {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <h3 className="text-lg font-bold text-text-main">근처 추천 스팟</h3>
      <div className="mt-4 flex flex-col gap-4">
        {spots.slice(0, 4).map((spot) => (
          <Link
            to={`/spots/${spot.id}`}
            key={spot.id}
            className="group flex items-start gap-4 rounded-lg p-2 transition-colors hover:bg-background"
          >
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
              <img
                src={spot.imageUrl}
                alt={spot.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold leading-tight text-text-main group-hover:text-primary">
                {spot.name}
              </h4>
              <p className="mt-1 text-sm text-text-secondary">{spot.category}</p>
              <div className="mt-1.5 flex items-center gap-1 text-sm text-text-secondary">
                <FaStar className="text-yellow-400" />
                <span className="font-bold text-text-main">
                  {spot.rating?.toFixed(1) || "0.0"}
                </span>
                <span>({spot.reviewCount || 0})</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedSpots;
