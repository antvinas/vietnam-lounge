// apps/web/src/components/plan/PlaceActions.tsx
import React from "react";
import { buildDirectionsUrl } from "@/utils/maps/urls";

type TravelModeAlias = "driving" | "walking" | "transit" | "bicycling";

export interface PlaceLike {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  placeId?: string;
}

interface Props {
  place: PlaceLike;
  origin?: { lat: number; lng: number } | string;
  onBookmark?: (p: PlaceLike) => void;
  onDuplicate?: (p: PlaceLike) => void;
  onDelete?: (p: PlaceLike) => void;
  className?: string;
}

const btn =
  "inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition";

export default function PlaceActions({
  place,
  origin,
  onBookmark,
  onDuplicate,
  onDelete,
  className,
}: Props) {
  const dest = { lat: place.lat, lng: place.lng };

  function openDir(mode: TravelModeAlias) {
    const url = buildDirectionsUrl({
      origin: origin ?? "My Location",
      destination: dest,
      mode,
    });
    window.open(url, "_blank", "noopener");
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      <button className={btn} onClick={() => openDir("driving")} aria-label="자동차 길찾기">
        🚗 길찾기
      </button>
      <button className={btn} onClick={() => openDir("transit")} aria-label="대중교통 길찾기">
        🚉 길찾기
      </button>
      <button className={btn} onClick={() => openDir("walking")} aria-label="도보 길찾기">
        🚶 길찾기
      </button>

      <span className="mx-1 h-6 w-px bg-slate-200 dark:bg-slate-700" />

      {onBookmark && (
        <button className={btn} onClick={() => onBookmark(place)} aria-label="북마크">
          ⭐ 북마크
        </button>
      )}
      {onDuplicate && (
        <button className={btn} onClick={() => onDuplicate(place)} aria-label="복제">
          🧩 복제
        </button>
      )}
      {onDelete && (
        <button className={btn} onClick={() => onDelete(place)} aria-label="삭제">
          🗑️ 삭제
        </button>
      )}
    </div>
  );
}
