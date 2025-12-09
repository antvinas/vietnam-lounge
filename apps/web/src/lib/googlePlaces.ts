// src/lib/googlePlaces.ts

import type { GooglePlace } from "@/types/googlePlaces";
import type { GooglePlaceLike } from "@/features/plan/stores/plan.store";

/**
 * GooglePlace(우리 앱 공통 장소 모델)
 *   -> GooglePlaceLike(Plan 스토어용 최소 장소 모델) 변환
 */
export function googlePlaceToGoogleLike(
  details: GooglePlace
): GooglePlaceLike {
  if (!details.location) {
    throw new Error(
      "[googlePlaceToGoogleLike] details.location 이 없습니다. " +
        "Places getDetails 호출 시 location(lat/lng)을 포함했는지 확인해 주세요."
    );
  }

  const { lat, lng } = details.location;

  const name =
    (details.name && details.name.trim()) ||
    details.formattedAddress ||
    "Unnamed place";

  return {
    googlePlaceId: details.placeId,
    name,
    lat,
    lng,
    address: details.address ?? details.formattedAddress,
    formattedAddress: details.formattedAddress,
    types: details.types ?? [],
    city: details.city,
    countryCode: details.countryCode,
  };
}
