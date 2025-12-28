// apps/web/src/components/common/AdSlot.tsx

import { useEffect } from "react";
import { logSponsorViewEvent, logSponsorClickEvent } from "@/api/ads.api";
import type { Spot } from "@/types/spot";

interface Props {
  type: "banner" | "infeed" | "sponsorBottom" | "sidebar";
  spot?: Spot;
  className?: string;
}

export default function AdSlot({ type, spot, className = "" }: Props) {
  useEffect(() => {
    // 🟢 spot이 있을 때만 로깅, 인자 전달 (spotId, type)
    if (spot) {
      logSponsorViewEvent(spot.id, type);
    }
  }, [spot, type]);

  if (!spot) return null;

  return (
    <div 
      className={`relative overflow-hidden rounded-lg shadow-sm border border-orange-100 bg-orange-50 cursor-pointer ${className}`}
      onClick={() => logSponsorClickEvent(spot.id, type)}
    >
      <div className="flex items-center p-3">
        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded border border-orange-200 mr-2">
          AD
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">{spot.name}</p>
          {spot.description && (
            <p className="text-xs text-gray-500 truncate">{spot.description}</p>
          )}
        </div>
      </div>
      
      {spot.imageUrl && (
        <div className="w-full h-32 overflow-hidden">
          <img 
            src={spot.imageUrl} 
            alt={spot.name} 
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}
    </div>
  );
}