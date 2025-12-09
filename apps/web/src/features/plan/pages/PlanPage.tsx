// apps/web/src/features/plan/pages/PlanPage.tsx

import React from "react";
import { Outlet } from "react-router-dom";

import { PlanOrchestrator } from "@/features/plan/components/layout/PlanOrchestrator";

/**
 * PlanPage
 * - 기존의 "중앙에 붕 떠있는 카드" 스타일을 제거하고,
 * - 화면 전체(Full Height)를 사용하는 레이아웃으로 변경
 */
export function PlanPage() {
  return (
    // [Layout 수정]
    // 1. h-[calc(100vh-64px)]: 글로벌 헤더(약 64px) 제외한 나머지 높이 꽉 채움
    // 2. w-full: 좌우 여백 제거
    // 3. bg-white: 배경을 흰색으로 통일 (회색 배경 제거)
    <div className="flex h-[calc(100vh-64px)] w-full flex-col overflow-hidden bg-white dark:bg-slate-950">
      <PlanOrchestrator />
      <Outlet />
    </div>
  );
}

export default PlanPage;