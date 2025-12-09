// src/hooks/useGoogleMaps.ts
import { Libraries, useJsApiLoader } from "@react-google-maps/api";

const DEFAULT_LIBRARIES: Libraries = ["places"];

export interface UseGoogleMapsOptions {
  id?: string;
  libraries?: Libraries;
}

/**
 * 프로젝트 전역에서 Google Maps JS API 로딩을 담당하는 훅.
 * - 내부적으로 @react-google-maps/api 의 useJsApiLoader 하나만 사용
 * - id 를 고정("vnl-map")해서 스크립트 중복 로딩 방지
 * - isLoaded 가 true 일 때 window.google 을 노출
 */
export function useGoogleMaps(options: UseGoogleMapsOptions = {}) {
  const { id = "vnl-map", libraries = DEFAULT_LIBRARIES } = options;

  const { isLoaded, loadError } = useJsApiLoader({
    id,
    googleMapsApiKey: import.meta.env.VITE_GMAPS_KEY as string,
    libraries,
  });

  const google =
    isLoaded && typeof window !== "undefined"
      ? ((window as any).google as typeof window.google | undefined)
      : undefined;

  return {
    isLoaded,
    loadError,
    google,
  };
}
