import { FiMapPin, FiPhone, FiExternalLink, FiGlobe, FiShare2 } from "react-icons/fi";

type Props = {
  spotName?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  websiteUrl?: string;
  bookingUrl?: string;
  className?: string;
};

export default function SpotActionBar({
  spotName = "스팟",
  lat,
  lng,
  phone,
  websiteUrl,
  bookingUrl,
  className = "",
}: Props) {
  const openInMaps = () => {
    if (typeof lat === "number" && typeof lng === "number") {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank", "noopener,noreferrer");
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: spotName, url });
      else {
        await navigator.clipboard.writeText(url);
        alert("링크가 복사되었습니다.");
      }
    } catch {}
  };

  const items = [
    { key: "map", label: "길찾기", onClick: openInMaps, show: typeof lat === "number" && typeof lng === "number", icon: <FiMapPin /> },
    { key: "tel", label: "전화", onClick: () => phone && window.open(`tel:${phone}`), show: !!phone, icon: <FiPhone /> },
    { key: "book", label: "예약", onClick: () => bookingUrl && window.open(bookingUrl, "_blank", "noopener,noreferrer"), show: !!bookingUrl, icon: <FiExternalLink /> },
    { key: "site", label: "웹사이트", onClick: () => websiteUrl && window.open(websiteUrl, "_blank", "noopener,noreferrer"), show: !!websiteUrl, icon: <FiGlobe /> },
    { key: "share", label: "공유", onClick: share, show: true, icon: <FiShare2 /> },
  ].filter((i) => i.show);

  return (
    <div className={`rounded-3xl border border-border bg-surface/90 p-3 shadow-lg backdrop-blur ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {items.map((i) => (
          <button
            key={i.key}
            onClick={i.onClick}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background-sub px-4 py-2 text-sm font-semibold text-text-main hover:bg-background"
          >
            {i.icon}
            {i.label}
          </button>
        ))}
      </div>
    </div>
  );
}
