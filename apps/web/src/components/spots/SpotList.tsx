import SpotCard from "@/components/common/SpotCard";
import type { Spot } from "@/types/spot";
import { useRef, useEffect } from "react";

interface Props {
  spots: Spot[];
  hoveredSpotId: string | null;
  setHoveredSpotId: (id: string | null) => void;
  selectedSpotId?: string | null;
  isLoading?: boolean;
}

export default function SpotList({
  spots,
  hoveredSpotId,
  setHoveredSpotId,
  selectedSpotId,
  isLoading = false,
}: Props) {
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (selectedSpotId && refs.current[selectedSpotId]) {
      refs.current[selectedSpotId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedSpotId]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="h-[360px] animate-pulse rounded-3xl bg-background-sub"
          >
            <div className="h-40 w-full rounded-t-3xl bg-black/10" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 rounded bg-black/10" />
              <div className="h-4 w-1/2 rounded bg-black/10" />
              <div className="h-4 w-2/3 rounded bg-black/10" />
              <div className="h-10 w-full rounded bg-black/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!spots.length) {
    return (
      <div className="col-span-full rounded-3xl border border-dashed border-border bg-background-sub px-6 py-12 text-center text-text-secondary">
        아직 조건에 맞는 스팟이 없어요. 다른 지역이나 카테고리를 선택해보세요.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
      {spots.map((spot) => (
        <div
          key={spot.id}
          ref={(el) => (refs.current[spot.id] = el)}
          onMouseEnter={() => setHoveredSpotId(spot.id)}
          onMouseLeave={() => setHoveredSpotId(null)}
          onFocus={() => setHoveredSpotId(spot.id)}
          onBlur={() => setHoveredSpotId(null)}
        >
          <SpotCard
            spot={spot}
            isHighlighted={selectedSpotId === spot.id || hoveredSpotId === spot.id}
          />
        </div>
      ))}
    </div>
  );
}
