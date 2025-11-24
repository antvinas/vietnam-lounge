/* @file apps/web/src/components/spots/SpotMap.tsx
   - @react-google-maps/api 로더 호출 제거
   - 공통 MapWrapper만 사용해 충돌 방지
*/
import MapWrapper from "@/components/common/MapWrapper";
import { useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { Spot } from "@/types/spot";

type Props =
  | {
      /** 여러 개 표시 */
      spots: Spot[];
      spot?: never;
      hoveredSpotId?: string | null;
      onSpotSelect?: (id: string) => void;
      className?: string;
      center?: { lat: number; lng: number };
      zoom?: number;
      height?: number | string;
      readOnly?: boolean;
    }
  | {
      /** 단일 상세용 */
      spot: Spot;
      spots?: never;
      hoveredSpotId?: string | null;
      onSpotSelect?: (id: string) => void;
      className?: string;
      center?: { lat: number; lng: number };
      zoom?: number;
      height?: number | string;
      readOnly?: boolean;
    };

const HANOI = { lat: 21.0278, lng: 105.8342 };

function toLatLng(s: any): { lat: number; lng: number } | undefined {
  if (typeof s?.latitude === "number" && typeof s?.longitude === "number")
    return { lat: s.latitude, lng: s.longitude };
  if (s?.coordinates && typeof s.coordinates.lat === "number" && typeof s.coordinates.lng === "number")
    return { lat: s.coordinates.lat, lng: s.coordinates.lng };
  if (s?.location && typeof s.location.lat === "number" && typeof s.location.lng === "number")
    return { lat: s.location.lat, lng: s.location.lng };
  return undefined;
}
const getId = (s: any) => s?.id ?? s?.firestoreId ?? s?._id ?? s?.slug;

export default function SpotMap(props: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const list = (props as any).spots as Spot[] | undefined;
  const single = (props as any).spot as Spot | undefined;
  const height = (props as any).height ?? 480;
  const zoom = (props as any).zoom ?? (single ? 15 : 12);
  const readOnly = Boolean((props as any).readOnly);

  const center = useMemo(() => {
    if ((props as any).center) return (props as any).center;
    if (single) {
      const c = toLatLng(single);
      if (c) return c;
    }
    const s = list?.[0];
    const c = s ? toLatLng(s) : undefined;
    return c ?? HANOI;
  }, [props, single, list]);

  const points = useMemo(() => {
    if (single) return [single].filter(Boolean) as Spot[];
    return (list || []).filter(Boolean);
  }, [single, list]);

  const markers = useMemo(
    () =>
      points
        .map((s) => {
          const c = toLatLng(s);
          if (!c) return null;
          return { lat: c.lat, lng: c.lng, id: String(getId(s) ?? ""), label: (s as any)?.name || "" };
        })
        .filter(Boolean) as { lat: number; lng: number; id: string; label?: string }[],
    [points]
  );

  const handleMarkerClick = useCallback(
    (m: { id?: string }) => {
      const s = points.find((p) => String(getId(p) ?? "") === String(m.id ?? ""));
      if (!s) return;
      const id: any = getId(s);
      (props as any).onSpotSelect?.(id);
      if (readOnly) return;
      const inAdult = location.pathname.startsWith("/adult");
      const base = inAdult ? "/adult/spots" : "/spots";
      if (id) navigate(`${base}/${id}`);
    },
    [points, props, readOnly, navigate, location.pathname]
  );

  return (
    <div className={(props as any).className} style={{ height }}>
      <MapWrapper
        className="w-full h-full"
        height={height}
        center={center}
        zoom={zoom}
        markers={markers}
        onMarkerClick={handleMarkerClick}
        showControls
      />
    </div>
  );
}
