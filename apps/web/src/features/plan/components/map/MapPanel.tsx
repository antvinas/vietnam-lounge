// apps/web/src/features/plan/components/map/MapPanel.tsx

import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  usePlanStore,
  selectItemsOfDay,
} from "@/features/plan/stores/plan.store";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

declare global {
  interface Window {
    google?: any;
  }
}
declare const google: any;

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
];

type MarkerEntry = {
  id: string; 
  marker: google.maps.Marker;
  baseColor: string;
};

type RoutePoint = {
  id: string;
  lat: number;
  lng: number;
  category?: string;
};

export default function MapPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    currentDayId,
    hoverSpotId,
    selectedItemId,
    setSelectedItemId,
    setEditingItemId,
    setMap,
    isItemDetailOpen,
  } = usePlanUIStore((s: any) => ({
    currentDayId: s.currentDayId,
    hoverSpotId: s.hoverSpotId,
    selectedItemId: s.selectedItemId,
    setSelectedItemId: s.setSelectedItemId,
    setEditingItemId: s.setEditingItemId,
    setMap: s.setMap,
    isItemDetailOpen: s.isItemDetailOpen,
  }));

  const { rawItems, places } = usePlanStore((s) => ({
    rawItems: currentDayId ? selectItemsOfDay(s, currentDayId) ?? [] : [],
    places: (s as any).places ?? {},
  }));

  const points: RoutePoint[] = useMemo(() => {
    if (!currentDayId) return [];
    const result: RoutePoint[] = [];
    (rawItems as any[]).forEach((item) => {
      const placeId = item.placeId;
      const place = placeId ? (places as any)[placeId] : undefined;
      const fromPlace = place && place.lat && place.lng ? { lat: place.lat, lng: place.lng } : null;
      const fromItem = item.lat && item.lng ? { lat: item.lat, lng: item.lng } : null;
      const gp = (item as any).googlePlace;
      const fromGp = gp && gp.lat && gp.lng ? { lat: gp.lat, lng: gp.lng } : null;
      const pos = fromPlace ?? fromItem ?? fromGp;

      if (!pos) return;
      result.push({ 
        id: item.id, 
        lat: pos.lat, 
        lng: pos.lng,
        category: item.category 
      });
    });
    return result;
  }, [rawItems, places, currentDayId]);

  const routePath = useMemo(() => points.map((p) => ({ lat: p.lat, lng: p.lng })), [points]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  
  const hasUserInteractedRef = useRef(false);
  const lastDayIdRef = useRef<string | null>(null);
  const prevPointsCountRef = useRef<number>(0);

  // 지도 초기화
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.google && mapContainerRef.current) {
        clearInterval(interval);
        if (!mapInstanceRef.current) {
          const map = new google.maps.Map(mapContainerRef.current, {
            center: { lat: 16.047, lng: 108.206 },
            zoom: 13,
            disableDefaultUI: true,
            zoomControl: true,
            backgroundColor: "#e5e7eb",
          });
          mapInstanceRef.current = map;
          setMap(map);

          const onInteract = () => { hasUserInteractedRef.current = true; };
          map.addListener("dragend", onInteract);
          map.addListener("zoom_changed", onInteract);
        }
      }
      if (attempts >= 50) clearInterval(interval);
    }, 200);
    return () => { clearInterval(interval); setMap(null); };
  }, [setMap]);

  // 테마 스타일 적용
  useEffect(() => {
    if (!mapInstanceRef.current || typeof document === "undefined") return;
    const map = mapInstanceRef.current;
    
    const updateStyle = () => {
      const isDark = document.documentElement.classList.contains("dark");
      map.setOptions({
        styles: isDark ? DARK_MAP_STYLE : [],
        backgroundColor: isDark ? "#242f3e" : "#e5e7eb",
      });
    };
    updateStyle();

    const obs = new MutationObserver((mts) => {
      mts.forEach((m) => {
        if (m.type === "attributes" && m.attributeName === "class") updateStyle();
      });
    });
    obs.observe(document.documentElement, { attributes: true });
    return () => obs.disconnect();
  }, []);

  // Day 변경 감지
  useEffect(() => {
    if (currentDayId !== lastDayIdRef.current) {
      hasUserInteractedRef.current = false;
      prevPointsCountRef.current = 0;
      lastDayIdRef.current = currentDayId ?? null;
    }
  }, [currentDayId]);

  // 마커 & 경로 그리기
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((e) => e.marker.setMap(null));
    markersRef.current.clear();
    if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }

    if (routePath.length > 1) {
      polylineRef.current = new google.maps.Polyline({
        path: routePath,
        map,
        strokeColor: "#22c55e",
        strokeOpacity: 0.8,
        strokeWeight: 4,
      });
    }

    points.forEach((pt, idx) => {
      const cat = (pt.category || "").toLowerCase();
      const isNightlife = ["karaoke", "club", "bar", "pub", "lounge", "nightlife"].some(k => cat.includes(k));
      
      const markerColor = isNightlife ? "#d946ef" : "#22c55e"; 

      const marker = new google.maps.Marker({
        position: { lat: pt.lat, lng: pt.lng },
        map,
        label: { text: `${idx + 1}`, color: "white", fontWeight: "bold" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        },
      });

      marker.addListener("click", () => {
        setSelectedItemId(pt.id);
        setEditingItemId(pt.id);
        hasUserInteractedRef.current = true;
        map.panTo({ lat: pt.lat, lng: pt.lng });
        if ((map.getZoom() || 0) < 15) map.setZoom(15);
      });

      markersRef.current.set(pt.id, { id: pt.id, marker, baseColor: markerColor });
    });

    // Auto Fit Bounds (전체 경로 보기)
    const prevCount = prevPointsCountRef.current;
    if (points.length > 0 && (!hasUserInteractedRef.current || points.length !== prevCount)) {
      const bounds = new google.maps.LatLngBounds();
      points.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      
      // [수정됨] 패널이 열려있으면 오른쪽 여백을 더 줘서 마커가 가려지지 않게 함
      const rightPadding = isItemDetailOpen ? 380 : 50;
      map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: rightPadding });
    }
    prevPointsCountRef.current = points.length;
  }, [points, routePath, currentDayId, setSelectedItemId, setEditingItemId, isItemDetailOpen]);

  // Selection Highlight & Pan Logic (패널 열림 대응)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((entry, id) => {
      const active = (hoverSpotId && id === hoverSpotId) || (selectedItemId && id === selectedItemId);
      const { marker, baseColor } = entry;
      
      marker.setIcon(active ? {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: baseColor,
        fillOpacity: 1,
        strokeWeight: 3,
        strokeColor: "#ffffff",
      } : {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: baseColor,
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "#ffffff",
      });
      marker.setZIndex(active ? 999 : 1);

      // [UX 개선] 아이템 선택 시 마커로 이동 + 패널 공간만큼 뷰포트 보정
      if (active && selectedItemId === id) {
        const pos = marker.getPosition();
        if (pos) {
          map.panTo(pos);
          if (isItemDetailOpen) {
            // 패널이 오른쪽(약 400px)에 있으므로, 지도를 오른쪽으로 살짝 밀어(panBy positive x)
            // 마커가 왼쪽(보이는 영역 중심)으로 오게 함
            map.panBy(150, 0); 
          }
        }
      }
    });
  }, [hoverSpotId, selectedItemId, isItemDetailOpen]);

  const openSearch = () => {
    if (!currentDayId) { toast("일차를 먼저 선택해주세요."); return; }
    navigate(`/plan/search?dayId=${currentDayId}`, { state: { backgroundLocation: location, background: location } });
  };

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full bg-slate-200 dark:bg-slate-800" />
      {points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto bg-white/90 dark:bg-gray-900/90 p-4 rounded-xl shadow-lg text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">등록된 장소가 없습니다.</p>
            <button onClick={openSearch} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600">
              장소 검색하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}