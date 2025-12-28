// apps/web/src/components/map/GoogleMap.tsx
import React, { useMemo } from "react";
import { GoogleMap as RGoogleMap, MarkerF } from "@react-google-maps/api";
import type { LatLng, Marker, MapClickPayload } from "./types";

export type GoogleMapProps = {
  className?: string;
  center: LatLng;
  zoom?: number;
  markers?: Marker[];
  /** 마커 클릭 */
  onMarkerClick?: (m: Marker) => void;
  /** 지도 클릭(픽커용) */
  onMapClick?: (p: MapClickPayload) => void;
  /** 지도 인스턴스 접근 필요할 때 */
  onMapLoad?: (map: google.maps.Map) => void;
  /** 확대/축소 등 컨트롤 */
  showControls?: boolean;
};

async function tryReverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  const g: any = (window as any).google;
  if (!g?.maps?.Geocoder) return undefined;

  return await new Promise((resolve) => {
    const geocoder = new g.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
      if (status === "OK" && results?.[0]?.formatted_address) resolve(results[0].formatted_address);
      else resolve(undefined);
    });
  });
}

export default function GoogleMap({
  className,
  center,
  zoom = 14,
  markers = [],
  onMarkerClick,
  onMapClick,
  onMapLoad,
  showControls = true,
}: GoogleMapProps) {
  const options = useMemo(
    () => ({
      disableDefaultUI: !showControls,
      zoomControl: showControls,
      mapTypeControl: showControls,
      streetViewControl: showControls,
      fullscreenControl: showControls,
      clickableIcons: false,
    }),
    [showControls]
  );

  return (
    <RGoogleMap
      mapContainerClassName={className ?? "w-full h-full"}
      center={center}
      zoom={zoom}
      options={options as any}
      onLoad={(map) => onMapLoad?.(map)}
      onClick={async (e) => {
        if (!onMapClick) return;
        const lat = e.latLng?.lat();
        const lng = e.latLng?.lng();
        if (typeof lat !== "number" || typeof lng !== "number") return;

        const address = await tryReverseGeocode(lat, lng);
        onMapClick({ lat, lng, address });
      }}
    >
      {markers.map((m) => (
        <MarkerF
          key={m.id}
          position={{ lat: m.lat, lng: m.lng }}
          title={m.title ?? m.label}
          onClick={() => onMarkerClick?.(m)}
        />
      ))}
    </RGoogleMap>
  );
}
