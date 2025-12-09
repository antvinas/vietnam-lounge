// src/types/googlePlaces.ts

/**
 * Google Places 관련 공통 타입 정의
 * - 이 파일이 PlacePrediction / GooglePlace의 단일 출처(Single Source of Truth)
 */

export type PlacePrediction = {
  /** Google Places prediction place_id */
  placeId: string;
  /** 전체 description (예: "카페 OO, 서울특별시 …") */
  description: string;
  /** main text (보통 상호명) */
  primaryText?: string;
  /** secondary text (보통 주소) */
  secondaryText?: string;
  /** Google place types */
  types?: string[];
};

/**
 * PlacesService.getDetails 결과를 우리 앱에서 쓰기 좋은 형태로 매핑한 타입
 */
export type GooglePlace = {
  /** Google place_id */
  placeId: string;
  /** 장소 이름 */
  name: string;

  /** Google의 formatted_address */
  formattedAddress?: string;

  /** 위도/경도 (geometry.location에서 파싱) */
  location?: {
    lat: number;
    lng: number;
  };

  /** Google place types */
  types?: string[];

  /** 나중에 주소 파싱해서 넣을 수 있는 필드들 */
  address?: string;
  city?: string;
  countryCode?: string;
};

/**
 * 과거 코드에서 PlaceDetails 이름을 쓰고 있었다면
 * 여기 alias 하나만 유지해 주면 됨.
 */
export type PlaceDetails = GooglePlace;
