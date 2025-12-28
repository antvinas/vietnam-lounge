// apps/web/src/hooks/useGoogleMaps.ts
import { Libraries, useJsApiLoader } from "@react-google-maps/api";

const DEFAULT_LIBRARIES: Libraries = ["places"];

export interface UseGoogleMapsOptions {
  id?: string;
  libraries?: Libraries;
}

/**
 * 프로젝트 전역에서 Google Maps JS API 로딩을 담당하는 훅.
 */
export function useGoogleMaps(options: UseGoogleMapsOptions = {}) {
  const { id = "vnl-map", libraries = DEFAULT_LIBRARIES } = options;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

  // 키가 없을 때만 에러 로그 출력 (필수 체크)
  if (!apiKey) {
    console.error("🚨 [Critical] Google Maps API Key가 비어있습니다! .env 파일을 확인해주세요.");
  }

  const { isLoaded, loadError } = useJsApiLoader({
    id,
    googleMapsApiKey: apiKey,
    libraries,
    language: "ko", 
    region: "VN",   
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