import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FiMapPin } from "react-icons/fi";
import type { Spot } from "@/types/spot";

type Props = {
  spots: Spot[];
  max?: number;
  title?: string;
  description?: string;
  className?: string;
};

export default function NearbyWidget({
  spots,
  max = 3,
  title = "내 주변 추천",
  description = "반경 3km 이내 스팟",
  className = "",
}: Props) {
  const items = useMemo(
    () =>
      spots
        ?.filter((s) => typeof s.distanceKm === "number")
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
        .slice(0, max),
    [spots, max]
  );

  return (
    <section
      className={`rounded-3xl bg-background-sub p-6 shadow-lg shadow-black/5 ring-1 ring-border/60 ${className}`}
    >
      <header className="mb-4 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {description}
        </p>
        <h3 className="text-xl font-semibold text-text-main">{title}</h3>
      </header>

      {items?.length ? (
        <div className="space-y-3">
          {items.map((spot) => (
            <Link
              key={spot.id}
              to={`/spots/${spot.id}`}
              className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3 transition hover:border-transparent hover:bg-primary/10"
            >
              <span className="mt-1 text-lg text-primary" aria-hidden>
                <FiMapPin />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-main group-hover:text-primary">
                  {spot.name}
                </p>
                <p className="truncate text-xs text-text-secondary">
                  {(spot.distanceKm ?? 0).toFixed(2)}km · {spot.category}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-secondary">
          위치 정보가 있는 스팟이 아직 없어요. 등록되면 자동으로 보여드릴게요.
        </p>
      )}
    </section>
  );
}
