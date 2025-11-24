import React from "react";

type Props = {
  phone?: string;
  websiteUrl?: string;
  bookingUrl?: string;
  lat?: number;
  lng?: number;
  spotName?: string;
  mapProvider?: "google" | "apple" | "osm";
  className?: string;
  onAction?: (action: "phone" | "website" | "booking" | "directions") => void;
};

function buildDirectionsUrl(
  provider: Props["mapProvider"],
  lat?: number,
  lng?: number,
  label?: string
) {
  if (!lat || !lng) return undefined;
  const q = encodeURIComponent(label ?? `${lat},${lng}`);
  switch (provider) {
    case "apple": return `https://maps.apple.com/?daddr=${lat},${lng}&q=${q}`;
    case "osm":   return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${lat}%2C${lng}`;
    default:      return `https://www.google.com/maps/dir/?api=1&destination=${lat}%2C${lng}&travelmode=driving`;
  }
}

export default function SpotPrimaryCtas({
  phone, websiteUrl, bookingUrl, lat, lng, spotName,
  mapProvider = "google", className = "", onAction,
}: Props) {
  const actions = [
    phone && { key: "phone", label: "전화", href: `tel:${phone}`, onClick: () => onAction?.("phone") },
    websiteUrl && { key: "website", label: "웹사이트", href: websiteUrl, onClick: () => onAction?.("website") },
    bookingUrl && { key: "booking", label: "예약", href: bookingUrl, onClick: () => onAction?.("booking") },
    buildDirectionsUrl(mapProvider, lat, lng, spotName) && {
      key: "directions", label: "길찾기",
      href: buildDirectionsUrl(mapProvider, lat, lng, spotName), onClick: () => onAction?.("directions")
    },
  ].filter(Boolean) as Array<{key:"phone"|"website"|"booking"|"directions";label:string;href?:string;onClick?:()=>void}>;

  if (!actions.length) return null;

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${className}`}>
      {actions.map(a => (
        <a
          key={a.key}
          href={a.href}
          target={a.key === "phone" ? "_self" : "_blank"}
          rel="noopener noreferrer"
          onClick={a.onClick}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 focus:outline-none focus-visible:ring focus-visible:ring-emerald-400"
          aria-label={a.label}
        >
          <span className="text-sm font-medium">{a.label}</span>
        </a>
      ))}
    </div>
  );
}
