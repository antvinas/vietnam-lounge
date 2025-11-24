import { PropsWithChildren } from "react";
import { Libraries, useJsApiLoader } from "@react-google-maps/api";

/**
 * Google Maps Script 로더
 * - libraries는 상수로 고정해 재장전 경고 제거
 * - 스크립트 로드 전에 children을 렌더하지 않음
 */
const LIBRARIES: Libraries = ["places"];

type MapWrapperProps = PropsWithChildren<{
  className?: string;
  fallback?: React.ReactNode;
}>;

export default function MapWrapper({ className, fallback = null, children }: MapWrapperProps) {
  const { isLoaded } = useJsApiLoader({
    id: "vnl-map",
    googleMapsApiKey: import.meta.env.VITE_GMAPS_KEY as string,
    libraries: LIBRARIES,
  });

  return <div className={className}>{isLoaded ? children : fallback}</div>;
}
