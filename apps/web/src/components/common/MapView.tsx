import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Spot } from "@/types/spot";
import { useEffect, useMemo } from "react";

type ContentMode = "explorer" | "nightlife";

const baseIconOptions: L.IconOptions = {
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
};

function FitBounds({ spots }: { spots: Spot[] }) {
  const map = useMap();
  useEffect(() => {
    if (!spots.length) return;
    const bounds = L.latLngBounds(
      spots.map((s) => L.latLng(s.latitude!, s.longitude!))
    );
    if (bounds.isValid()) map.fitBounds(bounds.pad(0.15));
  }, [spots, map]);
  return null;
}

interface Props {
  spots: Spot[];
  hoveredSpotId: string | null;
  className?: string;
  mode?: ContentMode;
  onSpotSelect?: (spotId: string) => void;
}

export default function MapView({
  spots,
  hoveredSpotId,
  className,
  mode = "explorer",
  onSpotSelect,
}: Props) {
  const defaultIcon = useMemo(
    () =>
      new L.Icon({
        ...baseIconOptions,
        className: "leaflet-marker-icon spot-marker",
      }),
    []
  );

  const highlightIcon = useMemo(
    () =>
      new L.Icon({
        ...baseIconOptions,
        className: `leaflet-marker-icon spot-marker spot-marker--highlight ${
          mode === "explorer"
            ? "spot-marker--explorer"
            : "spot-marker--nightlife"
        }`,
      }),
    [mode]
  );

  const initial = useMemo(() => {
    const s = spots.find(
      (v) => typeof v.latitude === "number" && typeof v.longitude === "number"
    );
    return s ? [s.latitude!, s.longitude!] : [10.776, 106.7]; // 호치민 기본 중심
  }, [spots]);

  const safeSpots = useMemo(
    () =>
      spots.filter(
        (s) =>
          typeof s.latitude === "number" && typeof s.longitude === "number"
      ),
    [spots]
  );

  return (
    <MapContainer
      center={initial as any}
      zoom={13}
      scrollWheelZoom
      className={`h-full w-full ${className ?? ""}`.trim()}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds spots={safeSpots} />

      {safeSpots.map((s) => {
        const icon = hoveredSpotId === s.id ? highlightIcon : defaultIcon;
        const gmapUrl = `https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`;
        return (
          <Marker
            key={s.id}
            position={[s.latitude!, s.longitude!] as any}
            icon={icon}
            eventHandlers={{
              click: () => {
                onSpotSelect?.(s.id);
              },
            }}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{s.name}</div>
                <div className="text-sm opacity-80">{s.address}</div>
                <a
                  href={gmapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-xs font-medium text-primary hover:underline"
                >
                  길찾기
                </a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
