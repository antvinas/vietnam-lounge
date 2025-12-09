import { useRef, useEffect, useCallback, useState } from "react";
import SpotCard from "@/features/spot/components/SpotCard";
import type { Spot } from "@/types/spot";

/** 광고형 spot 삽입 헬퍼 */
function insertSponsoredSpots(spots: Spot[]): Spot[] {
  const sponsored = spots.filter((s) => s.isSponsored && s.sponsorLevel === "infeed");
  const normal = spots.filter((s) => !s.isSponsored || s.sponsorLevel !== "infeed");
  const result: Spot[] = [];
  normal.forEach((spot, idx) => {
    result.push(spot);
    if ((idx + 1) % 6 === 0 && sponsored.length) {
      const ad = sponsored.shift();
      if (ad) result.push(ad);
    }
  });
  return result.concat(sponsored);
}

interface Props {
  spots: Spot[];
  hoveredSpotId: string | null;
  setHoveredSpotId: (id: string | null) => void;
  selectedSpotId?: string | null;
  isLoading?: boolean;
}

/** SpotList — 카드 리스트 + 무한 스크롤 + infeed 광고 */
export default function SpotList({
  spots,
  hoveredSpotId,
  setHoveredSpotId,
  selectedSpotId,
  isLoading = false,
}: Props) {
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    if (selectedSpotId && refs.current[selectedSpotId]) {
      refs.current[selectedSpotId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedSpotId]);

  const lastCardRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) setVisibleCount((p) => p + 6);
      });
      if (node) observerRef.current.observe(node);
    },
    [isLoading]
  );

  if (isLoading)
    return (
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={`skeleton-${i}`} className="h-[360px] animate-pulse rounded-3xl bg-background-sub dark:bg-surface/70" />
        ))}
      </div>
    );

  if (!spots.length)
    return (
      <div className="col-span-full rounded-3xl border border-dashed border-border bg-background-sub dark:bg-surface/70 px-6 py-12 text-center text-text-secondary">
        조건에 맞는 스팟이 없습니다.
      </div>
    );

  const mixedSpots = insertSponsoredSpots(spots);
  const displaySpots = mixedSpots.slice(0, visibleCount);

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
      {displaySpots.map((spot, i) => {
        const key = (spot as any)?.id || (spot as any)?.firestoreId || (spot as any)?._id || `${i}`;
        const isLast = i === displaySpots.length - 1;
        return (
          <div
            key={key}
            ref={(el) => {
              if ((spot as any)?.id) refs.current[(spot as any).id] = el;
              if (isLast) lastCardRef(el);
            }}
            onMouseEnter={() => setHoveredSpotId((spot as any).id)}
            onMouseLeave={() => setHoveredSpotId(null)}
            onFocus={() => setHoveredSpotId((spot as any).id)}
            onBlur={() => setHoveredSpotId(null)}
          >
            <SpotCard spot={spot} isHighlighted={selectedSpotId === (spot as any).id || hoveredSpotId === (spot as any).id} />
          </div>
        );
      })}
    </div>
  );
}
