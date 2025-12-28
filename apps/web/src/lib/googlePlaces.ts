// apps/web/src/lib/googlePlaces.ts

import type { GooglePlaceLike } from "@/features/plan/stores/plan.store";

const _GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

/**
 * Google Place ID로 상세 정보를 가져옵니다 (Maps JavaScript API 사용)
 * - 주의: 이 함수는 클라이언트 사이드에서 Maps JS API가 로드된 상태에서만 동작합니다.
 */
export const getPlaceDetails = async (placeId: string): Promise<GooglePlaceLike | null> => {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.warn("Google Maps Places API not loaded yet.");
    return null;
  }

  // 맵이 없는 상태에서 PlacesService를 쓰려면 
  // document.createElement('div') 같은 더미 엘리먼트를 사용할 수 있습니다.
  const dummyDiv = document.createElement("div");
  const service = new window.google.maps.places.PlacesService(dummyDiv);

  return new Promise((resolve) => {
    service.getDetails(
      {
        placeId,
        fields: ["name", "formatted_address", "geometry"],
      },
      (result: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          result &&
          result.geometry &&
          result.geometry.location
        ) {
          resolve({
            placeId,
            name: result.name || "",
            address: result.formatted_address || "",
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng(),
          });
        } else {
          console.error("Place details fetch failed:", status);
          resolve(null);
        }
      }
    );
  });
};