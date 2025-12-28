// web/src/components/spots/SpotMapCard.tsx
import React from "react";

type Props = {
  lat?: number;
  lng?: number;
  address?: string;
  spotName?: string;
  className?: string;
  mapHeight?: number | string;
  children?: React.ReactNode; // pass your actual <SpotMap .../> here if you have one
};

function gmapsLink(lat?: number, lng?: number, name?: string) {
  if (!lat || !lng) return undefined;
  const label = encodeURIComponent(name ?? `${lat},${lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${lat}%2C${lng}&query_place_id=&query=${label}`;
}

export default function SpotMapCard({
  lat,
  lng,
  address,
  spotName,
  className = "",
  mapHeight = 260,
  children,
}: Props) {
  const link = gmapsLink(lat, lng, spotName);

  return (
    <aside
      className={`sticky top-20 rounded-2xl bg-slate-800/60 border border-slate-700 p-4 ${className}`}
      aria-label="지도와 위치 정보"
    >
      <div
        className="rounded-xl overflow-hidden bg-slate-900/60 ring-1 ring-slate-700"
        style={{ height: typeof mapHeight === "number" ? `${mapHeight}px` : mapHeight }}
      >
        {children ? (
          children
        ) : (
          <div className="h-full w-full grid place-items-center text-slate-400 text-sm">
            <span>지도를 불러오는 중</span>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        {address ? <p className="text-slate-300 text-sm">{address}</p> : null}
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 text-sm focus:outline-none focus-visible:ring focus-visible:ring-emerald-400 rounded px-1"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 2a7 7 0 00-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
            </svg>
            구글지도에서 열기
          </a>
        ) : null}
      </div>
    </aside>
  );
}
