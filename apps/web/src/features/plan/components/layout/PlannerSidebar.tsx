import React from "react";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

// 🟢 하위 컴포넌트 임포트
import DaySidebar from "@/features/plan/components/day/DaySidebar";
import RoutePanel from "@/features/plan/components/map/RoutePanel";
import DualPlaceSearch from "@/features/plan/components/search/DualPlaceSearch"; 
// (만약 DualPlaceSearch가 없다면 기존 Search 로직을 분리해야 하지만, 우선 구조를 잡습니다)

export default function PlannerSidebar() {
  const isSidebarOpen = usePlanUIStore((s: any) => s.isSidebarOpen);
  const activeTab = usePlanUIStore((s: any) => s.activeTab); // 'day', 'route', 'search' 등

  // 사이드바가 닫혀있으면 렌더링 안 함
  if (!isSidebarOpen) return null;

  return (
    <div className="flex h-full w-[360px] flex-col border-r border-gray-200 bg-white shadow-xl z-20 transition-all dark:border-zinc-800 dark:bg-zinc-900">
      
      {/* 🟢 메인 컨텐츠 영역 (탭에 따라 내용 바뀜) */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "route" ? (
          <RoutePanel />
        ) : activeTab === "search" ? (
          // 검색 탭일 때 검색 컴포넌트 표시
          <div className="h-full w-full bg-white dark:bg-zinc-900">
             <DualPlaceSearch />
          </div>
        ) : (
          // 🟢 기본(day) 탭일 때 DaySidebar 렌더링 (여기에 1일차 탭 있음)
          <DaySidebar />
        )}
      </div>
    </div>
  );
}