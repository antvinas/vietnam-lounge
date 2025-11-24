/**
 * 공통 광고 슬롯 컴포넌트
 * - type: "banner" | "infeed" | "sponsorBottom"
 * - Firestore / GA4 로그 자동 기록
 */

import { useEffect } from "react";
import type { Spot } from "@/types/spot";
import { logSponsorViewEvent, logSponsorClickEvent } from "@/utils/analytics";
import "@/styles/spotAds.css";

interface Props {
  type: "banner" | "infeed" | "sponsorBottom";
  spot?: Spot;
}

const AdSlot = ({ type, spot }: Props) => {
  useEffect(() => {
    if (spot) logSponsorViewEvent(spot.id, type);
  }, [spot, type]);

  if (!spot)
    return (
      <div
        className="ad-slot w-full rounded-2xl border border-dashed border-border bg-background-sub dark:bg-surface/70 p-6 text-center text-text-secondary"
        aria-label="광고 슬롯 (데이터 없음)"
      >
        광고 영역 (데이터 없음)
      </div>
    );

  const label =
    type === "banner"
      ? "추천 스팟 배너"
      : type === "infeed"
      ? "리스트형 광고"
      : "스폰서 하단 배너";

  return (
    <div
      className="ad-slot relative w-full overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-amber-50 to-pink-50 dark:from-zinc-800 dark:to-zinc-900 shadow-sm"
      role="region"
      aria-label={label}
    >
      <a
        href={`/spots/${spot.id}`}
        onClick={() => logSponsorClickEvent(spot.id, type)}
        className="block p-6 text-center"
      >
        <div className="sponsor-badge mb-3 inline-block">{spot.sponsorLabel || "추천"}</div>
        <h3 className="text-lg font-bold text-text-main dark:text-white">{spot.name}</h3>
        {spot.description && (
          <p className="mt-1 line-clamp-2 text-sm text-text-secondary dark:text-text-secondary">
            {spot.description}
          </p>
        )}
      </a>
    </div>
  );
};

export default AdSlot;
