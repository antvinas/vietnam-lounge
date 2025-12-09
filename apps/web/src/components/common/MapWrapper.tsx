// src/components/common/MapWrapper.tsx
import { PropsWithChildren } from "react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";

type MapWrapperProps = PropsWithChildren<{
  className?: string;
  fallback?: React.ReactNode;
}>;

/**
 * Google Maps 로딩 상태에 따라 children 렌더링을 제어하는 래퍼.
 * - 스크립트 로딩은 useGoogleMaps 훅이 담당
 * - isLoaded 전에는 fallback 만 보여줌
 */
export default function MapWrapper({
  className,
  fallback = null,
  children,
}: MapWrapperProps) {
  const { isLoaded, loadError } = useGoogleMaps();

  if (loadError) {
    // 필요하면 여기에서 에러 UI로 교체 가능
    return (
      <div className={className}>
        {fallback ?? (
          <div className="p-2 text-xs text-red-500">
            지도를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </div>
        )}
      </div>
    );
  }

  return <div className={className}>{isLoaded ? children : fallback}</div>;
}
