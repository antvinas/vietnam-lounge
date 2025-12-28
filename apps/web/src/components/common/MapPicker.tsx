// apps/web/src/components/common/MapPicker.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";

import MapWrapper from "@/components/map/MapWrapper";
import GoogleMap from "@/components/map/GoogleMap";
import type { LatLng, Marker, MapClickPayload } from "@/components/map/types";

export type MapPickerLocation = { lat: number; lng: number; address?: string };

type MapPickerProps = {
  /** ✅ 권장: 도메인 친화 형태 */
  initialLocation?: MapPickerLocation;

  /** ✅ 레거시 호환: 기존 호출부가 initialLat/initialLng 쓰는 경우 */
  initialLat?: number;
  initialLng?: number;

  onLocationSelect: (location: MapPickerLocation) => void;

  /** 숫자(px) 또는 "400px" 같은 문자열도 허용 */
  height?: number | string;

  className?: string;

  /** 검색 UI 표시 여부 */
  enableSearch?: boolean;
};

const DEFAULT_CENTER: LatLng = { lat: 10.762622, lng: 106.660172 }; // HCMC

function normalizeHeight(h?: number | string, fallback = 360) {
  if (typeof h === "number") return h;
  if (typeof h === "string") {
    const m = h.trim().match(/^(\d+)(px)?$/);
    if (m?.[1]) return Number(m[1]);
  }
  return fallback;
}

export default function MapPicker({
  initialLocation,
  initialLat,
  initialLng,
  onLocationSelect,
  height = 360,
  className,
  enableSearch = true,
}: MapPickerProps) {
  const resolvedInitial = useMemo<MapPickerLocation>(() => {
    if (
      initialLocation &&
      Number.isFinite(initialLocation.lat) &&
      Number.isFinite(initialLocation.lng)
    ) {
      return initialLocation;
    }
    if (
      initialLat != null &&
      initialLng != null &&
      Number.isFinite(initialLat) &&
      Number.isFinite(initialLng)
    ) {
      return { lat: initialLat, lng: initialLng };
    }
    return { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng };
  }, [initialLocation, initialLat, initialLng]);

  const [center, setCenter] = useState<LatLng>(() => ({
    lat: resolvedInitial.lat,
    lng: resolvedInitial.lng,
  }));
  const [markerPos, setMarkerPos] = useState<LatLng>(() => ({
    lat: resolvedInitial.lat,
    lng: resolvedInitial.lng,
  }));

  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setCenter({ lat: resolvedInitial.lat, lng: resolvedInitial.lng });
    setMarkerPos({ lat: resolvedInitial.lat, lng: resolvedInitial.lng });
  }, [resolvedInitial.lat, resolvedInitial.lng]);

  const markers = useMemo<Marker[]>(
    () => [
      {
        id: "picker",
        lat: markerPos.lat,
        lng: markerPos.lng,
        label: "선택 위치",
        title: "선택 위치",
      },
    ],
    [markerPos.lat, markerPos.lng],
  );

  const handleMapClick = useCallback(
    (p: MapClickPayload) => {
      setMarkerPos({ lat: p.lat, lng: p.lng });
      setCenter({ lat: p.lat, lng: p.lng });
      onLocationSelect({ lat: p.lat, lng: p.lng, address: p.address });
    },
    [onLocationSelect],
  );

  const handleSearch = useCallback(async () => {
    setSearchError(null);

    const q = query.trim();
    if (!q) return;

    const g = (window as any)?.google;
    const Geocoder = g?.maps?.Geocoder;
    if (!Geocoder) {
      setSearchError("Google 지도 검색을 사용할 수 없습니다. (Geocoder 미로딩)");
      return;
    }

    setSearching(true);
    try {
      const geocoder = new Geocoder();
      geocoder.geocode({ address: q }, (results: any[], status: string) => {
        setSearching(false);

        if (status !== "OK" || !results || results.length === 0) {
          setSearchError("검색 결과가 없습니다.");
          return;
        }

        const r = results[0];
        const loc = r?.geometry?.location;

        const lat = typeof loc?.lat === "function" ? loc.lat() : loc?.lat;
        const lng = typeof loc?.lng === "function" ? loc.lng() : loc?.lng;

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          setSearchError("검색 결과 좌표를 읽을 수 없습니다.");
          return;
        }

        const address = r?.formatted_address;
        setCenter({ lat, lng });
        setMarkerPos({ lat, lng });
        onLocationSelect({ lat, lng, address });
      });
    } catch (e) {
      console.error(e);
      setSearching(false);
      setSearchError("검색 중 오류가 발생했습니다.");
    }
  }, [query, onLocationSelect]);

  const heightNum = normalizeHeight(height, 360);

  return (
    <div
      className={`w-full rounded-lg overflow-hidden border border-gray-300 shadow-sm ${
        className ?? ""
      }`}
    >
      <div className="relative">
        {enableSearch && (
          <div className="absolute top-2 left-2 right-2 z-10">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder="장소 검색 (주소/키워드)"
                className="w-full pl-10 pr-24 py-2 rounded shadow border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching}
                className="absolute right-2 top-1.5 px-3 py-1.5 rounded bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {searching ? "검색중" : "검색"}
              </button>
            </div>

            {searchError && (
              <div className="mt-2 text-xs text-red-600 bg-white/90 border border-red-200 rounded p-2">
                {searchError}
              </div>
            )}
          </div>
        )}

        <div style={{ height: heightNum }} className="w-full">
          <MapWrapper
            className="w-full h-full"
            fallback={
              <div className="w-full h-full flex items-center justify-center text-sm text-gray-400 bg-gray-50">
                지도를 불러오는 중...
              </div>
            }
          >
            <GoogleMap
              className="w-full h-full"
              center={center}
              zoom={15}
              markers={markers}
              onMapClick={handleMapClick}
              showControls
            />
          </MapWrapper>
        </div>

        <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded bg-white/90 px-3 py-1.5 text-xs text-gray-700 shadow">
          <FaMapMarkerAlt className="text-red-500" />
          <span>
            {markerPos.lat.toFixed(6)}, {markerPos.lng.toFixed(6)}
          </span>
        </div>
      </div>
    </div>
  );
}
