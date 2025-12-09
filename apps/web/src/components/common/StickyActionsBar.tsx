// src/components/common/StickyActionsBar.tsx
import { FaDirections, FaPhoneAlt, FaShareAlt, FaRegBookmark, FaBookmark } from "react-icons/fa";
import { useMemo, useState } from "react";

type LatLng = { lat: number; lng: number };

type Props =
  | {
      spot: {
        name: string;
        address?: string;
        phone?: string;
        location?: LatLng;
        coordinates?: LatLng;
      };
      center?: never;
      title?: never;
    }
  | {
    spot?: never;
    center: LatLng;
    title?: string;
    phone?: string;
    address?: string;
  };

export default function StickyActionsBar(props: Props) {
  const [saved, setSaved] = useState(false);

  const name = "spot" in props && props.spot ? props.spot.name : props.title || "현재 위치";
  const phone = "spot" in props && props.spot ? props.spot.phone : (props as any).phone;
  const address = "spot" in props && props.spot ? props.spot.address : (props as any).address;

  const coord: LatLng | null = useMemo(() => {
    if ("spot" in props && props.spot) {
      return props.spot.location || props.spot.coordinates || null;
    }
    return (props as any).center || null;
  }, [props]);

  const mapsUrl = coord ? `https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lng}` : undefined;
  const dirUrl = coord ? `https://www.google.com/maps/dir/?api=1&destination=${coord.lat},${coord.lng}` : undefined;

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) await navigator.share({ title: name, text: address || name, url });
      else {
        await navigator.clipboard.writeText(url);
        alert("링크 복사 완료");
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[10000] block md:hidden" role="region" aria-label="빠른 동작 바">
      <div className="mx-auto mb-3 w-[min(640px,92vw)] rounded-2xl border border-border bg-surface p-2 shadow-card">
        <div className="flex items-stretch justify-between gap-2">
          <a
            href={dirUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-3 text-sm font-bold text-white active:opacity-90"
            aria-label={dirUrl ? `${name} 길찾기 열기` : "길찾기 사용 불가"}
          >
            <FaDirections aria-hidden="true" /> 길찾기
          </a>

          <button
            onClick={share}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-background-sub px-3 py-3 text-sm font-bold text-text-main"
            aria-label={`${name} 링크 공유`}
          >
            <FaShareAlt aria-hidden="true" /> 공유
          </button>

          {phone ? (
            <a
              href={`tel:${phone}`}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-background-sub px-3 py-3 text-sm font-bold text-text-main"
              aria-label={`${name} 전화 걸기`}
            >
              <FaPhoneAlt aria-hidden="true" /> 전화
            </a>
          ) : (
            <button
              disabled
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-background-sub px-3 py-3 text-sm font-bold text-text-secondary opacity-60"
              aria-label="전화번호 없음"
              title="전화번호 없음"
            >
              <FaPhoneAlt aria-hidden="true" /> 전화
            </button>
          )}

          <button
            onClick={() => setSaved((v) => !v)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-background-sub px-3 py-3 text-sm font-bold text-text-main"
            aria-pressed={saved}
            aria-label={saved ? `${name} 저장 해제` : `${name} 저장`}
          >
            {saved ? <FaBookmark aria-hidden="true" /> : <FaRegBookmark aria-hidden="true" />} 저장
          </button>
        </div>
      </div>
    </div>
  );
}
