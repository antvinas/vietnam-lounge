// apps/web/src/components/map/MapWrapper.tsx
import React from "react";
import { useLoadScript } from "@react-google-maps/api";

export type Libraries = ("places" | "geometry" | "drawing" | "visualization")[];

export type MapWrapperProps = {
  className?: string;
  /** 컨테이너 높이. (숫자면 px) */
  height?: number | string;
  /** 로딩/에러시 보여줄 fallback */
  fallback?: React.ReactNode;
  /** maps libraries */
  libraries?: Libraries;
  /** 언어 */
  language?: string;
  /** children은 로드 성공했을 때만 렌더 */
  children: React.ReactNode;
};

const DEFAULT_LIBRARIES: Libraries = ["places"];

const DefaultFallback = ({ text }: { text: string }) => (
  <div className="flex h-full w-full items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">
    {text}
  </div>
);

export default function MapWrapper({
  className,
  height = 480,
  fallback,
  libraries = DEFAULT_LIBRARIES,
  language = "ko",
  children,
}: MapWrapperProps) {
  // SSR 안전장치
  const isBrowser = typeof window !== "undefined";
  const apiKey = (import.meta as any)?.env?.VITE_GOOGLE_MAPS_API_KEY || "";

  // ✅ 중요: id 고정(중복 script 방지)
  const { isLoaded, loadError } = useLoadScript(
    isBrowser
      ? {
          id: "google-maps-script",
          googleMapsApiKey: apiKey,
          libraries,
          language,
        }
      : (undefined as any)
  );

  const style: React.CSSProperties = {
    height: typeof height === "number" ? `${height}px` : height,
    width: "100%",
  };

  if (!isBrowser) {
    return (
      <div className={className} style={style}>
        {fallback ?? <DefaultFallback text="지도를 불러오는 중..." />}
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className={className} style={style}>
        {fallback ?? <DefaultFallback text="Google Maps API Key가 설정되지 않았습니다." />}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={className} style={style}>
        {fallback ?? <DefaultFallback text="지도 로딩에 실패했습니다." />}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={className} style={style}>
        {fallback ?? <DefaultFallback text="지도를 불러오는 중..." />}
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
