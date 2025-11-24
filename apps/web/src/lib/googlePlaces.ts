// apps/web/src/lib/googlePlaces.ts

/**
 * Google Places 데이터 → 우리 Plan 스토어에서 쓰기 좋은 형태로
 * 매핑해주는 유틸리티 모음.
 *
 * - React 훅(usePlacesAutocomplete)이 반환하는 PlaceDetails를
 *   plan.store.ts 안의 GooglePlaceLike 타입으로 변환하는 역할만 담당.
 * - 실제 Google Maps JS API 호출은 전부 useGooglePlaces.ts 안에서 처리한다.
 */

import type { PlaceDetails } from "@/hooks/useGooglePlaces";
import type { GooglePlaceLike } from "@/store/plan.store";

/**
 * PlaceDetails (usePlacesAutocomplete → getPlaceDetails 결과)를
 * Plan 스토어에서 사용하는 GooglePlaceLike 타입으로 변환.
 *
 * - 반드시 geometry.location(lat/lng)이 있어야 한다.
 *   (없으면 에러를 던지고, 호출하는 쪽에서 예외 처리)
 * - address / formattedAddress / types 등은 그대로 복사.
 *
 * ⚠️ city / countryCode 는 아직 파싱 로직이 없어서 undefined 로 둔다.
 *    나중에 필요할 때 이 파일 하나만 손보면 됨.
 */
export function placeDetailsToGoogleLike(
  details: PlaceDetails
): GooglePlaceLike {
  if (!details.location) {
    throw new Error(
      "[placeDetailsToGoogleLike] details.location 이 없습니다. " +
        "Places getDetails 호출 시 geometry 필드를 포함하도록 확인해 주세요."
    );
  }

  const { lat, lng } = details.location;

  // name 이 비어있으면 formattedAddress 를 fallback 으로 사용
  const name =
    (details.name && details.name.trim()) ||
    details.formattedAddress ||
    "Unnamed place";

  return {
    googlePlaceId: details.placeId,
    name,
    lat,
    lng,
    // address 는 지금은 formattedAddress 를 그대로 씀
    address: details.formattedAddress,
    formattedAddress: details.formattedAddress,
    types: details.types ?? [],
    // TODO: 필요해지면 formattedAddress/주소 컴포넌트에서 파싱
    city: undefined,
    countryCode: undefined,
  };
}

/**
 * (옵션) 검색 결과 한 줄에서 "Google Maps에서 보기" 링크를 만들고 싶을 때 사용.
 *  - placeId 기반 URL
 *  - 예: https://www.google.com/maps/place/?q=place_id:XXXX
 */
export function buildGoogleMapsPlaceUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(
    placeId
  )}`;
}

/**
 * (옵션) lat/lng 기반으로 바로 지도를 열고 싶을 때 사용할 수 있는 URL 헬퍼.
 *  - 예: https://www.google.com/maps/search/?api=1&query=lat,lng
 */
export function buildGoogleMapsLatLngUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${lat},${lng}`
  )}`;
}
