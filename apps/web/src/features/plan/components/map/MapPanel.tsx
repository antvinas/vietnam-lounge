import React, { useEffect, useMemo, useRef } from "react";
// 🟢 스토어와 셀렉터를 올바르게 임포트
import { usePlanStore, selectItemsOfDay } from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

// 구글맵 스크립트 로드 함수
function ensureGoogleMapsLoaded(apiKey: string, libraries: string[] = []) {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if ((window as any).google?.maps) return Promise.resolve();

  const libParam = libraries.length ? `&libraries=${libraries.join(",")}` : "";
  const src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}${libParam}`;

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps script")));
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });
}

export default function MapPanel() {
  const googleMapsKey =
    (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_KEY ||
    "";

  // 🟢 [핵심 수정] 스토어에서 개별 상태들을 올바르게 구독
  const currentDayId = usePlanUIStore((s: any) => s.currentDayId as string | null);
  const hoverSpotId = usePlanUIStore((s: any) => s.hoverSpotId as string | null);
  const selectedItemId = usePlanUIStore((s: any) => s.selectedItemId as string | null);
  const isItemDetailOpen = usePlanUIStore((s: any) => s.isItemDetailOpen as boolean);
  const setMap = usePlanUIStore((s: any) => s.setMap as (m: google.maps.Map | null) => void);

  // 🟢 [핵심 수정] 정규화된 데이터(items, places)를 가져오는 로직
  const items = usePlanStore((state) => selectItemsOfDay(state, currentDayId));
  const places = usePlanStore((state) => state.places);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  // 🟢 데이터를 지도용 포인트로 변환
  const points = useMemo(() => {
    if (!items || items.length === 0) return [];

    return items
      .map((it, idx) => {
        let lat = it.lat;
        let lng = it.lng;

        // lat/lng이 아이템에 없으면 연결된 place에서 찾기
        if ((lat === undefined || lng === undefined) && it.placeId && places[it.placeId]) {
            lat = places[it.placeId].lat;
            lng = places[it.placeId].lng;
        }

        if (typeof lat !== 'number' || typeof lng !== 'number') return null;

        return {
          id: it.id,
          title: it.title || "제목 없음",
          position: { lat, lng },
          index: idx + 1,
        };
      })
      .filter((p): p is { id: string; title: string; position: google.maps.LatLngLiteral; index: number } => p !== null);
  }, [items, places]);

  // 1) 구글맵 초기화
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!containerRef.current) return;
      if (!googleMapsKey) return;

      try {
        await ensureGoogleMapsLoaded(googleMapsKey, ["places"]);
        if (cancelled) return;

        if (mapRef.current) return;

        const map = new google.maps.Map(containerRef.current, {
          center: points[0]?.position ?? { lat: 16.0471, lng: 108.2068 }, // 다낭 기본값
          zoom: points.length ? 12 : 10,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapRef.current = map;
        setMap(map);
      } catch (e) {
        console.error("[MapPanel] Google Maps Load Failed:", e);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [googleMapsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2) 마커/경로 다시 그리기
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();

    // 기존 polyline 제거
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (!points.length) return;

    // 마커 생성
    points.forEach((pt) => {
      const marker = new google.maps.Marker({
        map,
        position: pt.position,
        title: pt.title,
        label: {
          text: String(pt.index),
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: "700",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#10B981", // emerald
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 9,
        },
        zIndex: 10,
      });

      markersRef.current.set(pt.id, marker);
    });

    // 경로선
    if (points.length >= 2) {
      polylineRef.current = new google.maps.Polyline({
        map,
        path: points.map((p) => p.position),
        geodesic: true,
        strokeColor: "#10B981",
        strokeOpacity: 0.8,
        strokeWeight: 4,
      });
    }

    // bounds fit (마커가 모두 보이도록 줌 조절)
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p.position));
    map.fitBounds(bounds);

    // 마커가 너무 적거나 좁으면 줌 아웃 제한
    const listener = google.maps.event.addListenerOnce(map, "idle", () => {
        if (map.getZoom()! > 16) map.setZoom(16);
    });
    return () => google.maps.event.removeListener(listener);

  }, [points]);

  // 3) 선택/호버 상태 강조
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const isActive = id === selectedItemId || id === hoverSpotId;

      marker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: isActive ? "#F97316" : "#10B981", // active=orange
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        scale: isActive ? 12 : 9,
      });

      marker.setZIndex(isActive ? 999 : 10);
    });
  }, [selectedItemId, hoverSpotId]);

  // 4) 호버 시 지도 이동
  const lastHoverRef = useRef<string | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!hoverSpotId) {
      lastHoverRef.current = null;
      return;
    }

    if (lastHoverRef.current === hoverSpotId) return;
    lastHoverRef.current = hoverSpotId;

    const marker = markersRef.current.get(hoverSpotId);
    if (!marker) return;

    const pos = marker.getPosition();
    if (!pos) return;

    const t = window.setTimeout(() => {
      const bounds = map.getBounds();
      const inside = bounds ? bounds.contains(pos) : true;

      if (!inside) {
        map.panTo(pos);
        if (isItemDetailOpen) map.panBy(180, 0);
      }
    }, 120);

    return () => window.clearTimeout(t);
  }, [hoverSpotId, isItemDetailOpen]);

  return (
    <div className="h-full w-full">
      <div ref={containerRef} className="h-full w-full rounded-2xl bg-gray-100" />
    </div>
  );
}