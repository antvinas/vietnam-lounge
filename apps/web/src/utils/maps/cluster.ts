import { MarkerClusterer } from "@googlemaps/markerclusterer";

/** 마커 클러스터러 생성 */
export function createClusterer(map: google.maps.Map, markers: google.maps.Marker[]) {
  return new MarkerClusterer({ map, markers });
}

/** 마커 클러스터러 해제 */
export function destroyClusterer(clusterer: ReturnType<typeof createClusterer>) {
  try {
    // 최신 MarkerClusterer는 setMap(null) 대신 clearMarkers 제공
    (clusterer as any)?.clearMarkers?.();
    (clusterer as any)?.setMap?.(null);
  } catch {}
}
