import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FiClock } from "react-icons/fi";
import type { Spot } from "@/types/spot";

type Props = {
  spots: Spot[];
  max?: number;
  title?: string;
  description?: string;
  className?: string;
};

export default function OpenNowWidget({
  spots,
  max = 3,
  title = "오픈 나우",
  description = "지금 바로 방문 가능한 장소",
  className = "",
}: Props) {
  const items = useMemo(
    () => spots?.filter((s) => s.isOpenNow).slice(0, max),
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
                <FiClock />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-main group-hover:text-primary">
                  {spot.name}
                </p>
                <p className="truncate text-xs text-text-secondary">
                  {spot.operatingHours || "운영시간 정보 업데이트 예정"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-secondary">
          현재 영업 중인 스팟이 없거나, 운영 시간이 등록되지 않았어요.
        </p>
      )}
    </section>
  );
}
