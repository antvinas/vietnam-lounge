// src/components/MapPanel.tsx
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { Spot } from "@/lib/spots";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { X, Crosshair } from "lucide-react";
import { useMemo, useRef } from "react";

L.Icon.Default.mergeOptions({ iconUrl, shadowUrl: iconShadow });

type Props = {
    spots: Spot[];
    onClose?: () => void;
    title?: string;
    full?: boolean;
    onSearchThisArea?: (center: { lat: number; lng: number }, radiusKm: number) => void;
};

function SearchAreaButton({ onSearch }: { onSearch: (center: any, radiusKm: number) => void }) {
    const map = useMap();
    return (
        <button
            className="absolute right-4 bottom-4 z-[500] inline-flex items-center gap-2 rounded-xl bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 px-3 py-2 shadow-md"
            onClick={() => {
                const b = map.getBounds();
                const center = b.getCenter();
                const sw = b.getSouthWest(), ne = b.getNorthEast();
                const R = 6371;
                const d = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                    const dLat = ((lat2 - lat1) * Math.PI) / 180;
                    const dLon = ((lon2 - lon1) * Math.PI) / 180;
                    const a = Math.sin(dLat / 2) ** 2 +
                        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
                    return 2 * R * Math.asin(Math.sqrt(a));
                };
                const radiusKm = d(sw.lat, sw.lng, ne.lat, ne.lng) / 2;
                onSearch({ lat: center.lat, lng: center.lng }, Math.max(1, Math.min(25, radiusKm)));
            }}
        >
            <Crosshair className="h-4 w-4" />
            이 지역 검색
        </button>
    );
}

export default function MapPanel({ spots, onClose, title = "지도", full, onSearchThisArea }: Props) {
    const firstWithLoc = spots.find((s) => s.location);
    const center = useMemo<[number, number]>(() =>
        firstWithLoc?.location ? [firstWithLoc.location.lat, firstWithLoc.location.lng] : [10.77978, 106.699],
        [firstWithLoc]
    );
    const ref = useRef<any>(null);

    return (
        <div className={`h-full w-full rounded-2xl overflow-hidden border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 ${full ? "rounded-none border-0" : ""}`}>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-300 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/80">
                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{title}</div>
                <button
                    aria-label="지도 닫기"
                    className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    onClick={onClose}
                >
                    <X className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                </button>
            </div>

            <div className={full ? "h-[calc(100vh-48px)] w-full" : "h-[calc(100%-40px)] w-full"}>
                <MapContainer center={center} zoom={13} className="h-full w-full" ref={ref as any}>
                    <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {spots.filter((s) => s.location).map((s) => (
                        <Marker key={s.id} position={[s.location!.lat, s.location!.lng]}>
                            <Popup>
                                <div className="font-semibold">{s.name}</div>
                                <div className="text-sm text-neutral-600">{s.city ?? ""}</div>
                            </Popup>
                        </Marker>
                    ))}
                    {onSearchThisArea ? <SearchAreaButton onSearch={onSearchThisArea} /> : null}
                </MapContainer>
            </div>
        </div>
    );
}
