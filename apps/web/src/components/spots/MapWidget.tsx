import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { Spot } from "@/types/spot";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Leaflet 기본 아이콘 버그 수정
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapWidgetProps {
  spot: Spot;
}

const MapWidget = ({ spot }: MapWidgetProps) => {
  if (!spot.latitude || !spot.longitude) return null;

  const position: [number, number] = [spot.latitude, spot.longitude];
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${spot.latitude},${spot.longitude}`;
  const directionUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.latitude},${spot.longitude}`;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="h-48">
        <MapContainer
          center={position}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
          dragging={false}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>
              <strong>{spot.name}</strong>
              <br />
              {spot.address}
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      <div className="p-4 space-y-2">
        <h4 className="font-semibold text-text-main">위치 정보</h4>
        <p className="mt-1 truncate text-sm text-text-secondary">{spot.address}</p>
        <div className="flex gap-3 text-sm font-bold">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            지도 보기
          </a>
          <a
            href={directionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            길찾기
          </a>
        </div>
      </div>
    </div>
  );
};

export default MapWidget;
