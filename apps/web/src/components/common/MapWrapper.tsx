// apps/web/src/components/common/MapWrapper.tsx
import React from "react";
import MapWrapper, { type MapWrapperProps } from "@/components/map/MapWrapper";

/**
 * @deprecated
 * ✅ 3층 분리(C안) 적용 이후에는 이 common/MapWrapper를 직접 쓰지 말고,
 * 반드시 "@/components/map/MapWrapper"를 사용하세요.
 *
 * - 기존 import 경로 호환을 위해 남겨둔 래퍼입니다.
 * - 로딩 로직(useGoogleMaps)은 제거하고, map/MapWrapper를 그대로 위임합니다.
 */
export default function CommonMapWrapper(props: MapWrapperProps) {
  return <MapWrapper {...props} />;
}
