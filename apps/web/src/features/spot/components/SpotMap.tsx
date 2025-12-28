// apps/web/src/features/spot/components/SpotMap.tsx
import { useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { Spot } from "@/types/spot";

import MapWrapper from "@/components/map/MapWrapper";
import GoogleMap from "@/components/map/GoogleMap";
import type { Marker, LatLng } from "@/components/map/types";

type Props =
  | {
      /** 여러 개 표시 */
      spots: Spot[];
      spot?: never;
      hoveredSpotId?: string | null;
      onSpotSelect?: (id: string) => void;
      className?: string;
      center?: LatLng;
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
      center?: LatLng;
      zoom?: number;
      height?: number | string;
      readOnly?: boolean;
    };

const HANOI: LatLng = { lat: 21.0278, lng: 105.8342 };

function toLatLng(s: any): LatLng | undefined {
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

  const center = useMemo<LatLng>(() => {
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

  const markers = useMemo<Marker[]>(
    () =>
      points
        .map((s) => {
          const c = toLatLng(s);
          if (!c) return null;
          return {
            lat: c.lat,
            lng: c.lng,
            id: String(getId(s) ?? ""),
            label: (s as any)?.name || "",
            title: (s as any)?.name || "",
          };
        })
        .filter(Boolean) as Marker[],
    [points]
  );

  const handleMarkerClick = useCallback(
    (m: Marker) => {
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
    <div className={(props as any).className} style={{ height: typeof height === "number" ? `${height}px` : height }}>
      <MapWrapper className="w-full h-full" height="100%">
        <GoogleMap
          className="w-full h-full"
          center={center}
          zoom={zoom}
          markers={markers}
          onMarkerClick={handleMarkerClick}
          showControls
        />
      </MapWrapper>
    </div>
  );
}
