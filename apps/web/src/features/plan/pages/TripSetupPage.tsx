// src/features/plan/pages/TripSetupPage.tsx

import React from "react";

// TripSetup UI 컴포넌트 위치 (리팩토링 후 기준)
// - 지금은 src/components/plan/TripSetup.tsx 에 있을 수 있음
// - P3-1에서 말한 구조로 가면 src/features/plan/components/plan/TripSetup.tsx 로 옮기는 게 이상적
import TripSetup from "@/features/plan/components/plan/TripSetup";

/**
 * TripSetupPage
 *
 * - 새 여행 일정 생성/초기 설정(도시, 날짜, 인원 등)을 담당하는 페이지
 * - 실제 UI/폼은 TripSetup 컴포넌트에 모아 두고,
 *   페이지는 라우터/레이아웃/메타정보만 관리하는 패턴
 */
export function TripSetupPage() {
  return <TripSetup />;
}

export default TripSetupPage;
