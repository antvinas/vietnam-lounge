import React from "react";
import { usePlanUIStore } from "@/features/plan/stores/plan.ui.store";

// 컴포넌트 임포트 (경로 확인해주세요)
import PlannerSidebar from "@/features/plan/components/layout/PlannerSidebar";
import MapPanel from "@/features/plan/components/map/MapPanel";
import MapToolbar from "@/features/plan/components/map/MapToolbar";
import PlanItemDetailDrawer from "@/features/plan/components/detail/PlanItemDetailDrawer";
import { PlanOrchestrator } from "@/features/plan/components/layout/PlanOrchestrator";

export function PlanPage() {
  // 상세 패널 활성화 여부 체크
  const editingItemId = usePlanUIStore((s: any) => s.editingItemId);

  return (
    <div className="flex h-[calc(100vh-64px)] w-full flex-col overflow-hidden bg-white dark:bg-slate-950">
      
      {/* 로직 오케스트레이터 */}
      <PlanOrchestrator />

      <div className="relative flex flex-1 overflow-hidden">
        
        {/* 1. 좌측: 사이드바 (일정 리스트 등) */}
        <PlannerSidebar />

        {/* 2. 중앙: 지도 */}
        <div className="relative flex-1 bg-gray-100 dark:bg-zinc-800">
          <MapPanel />
          <div className="absolute left-4 top-4 z-10">
            <MapToolbar />
          </div>
        </div>

        {/* 🟢 [추가] 3. 우측: 상세 편집 패널 (지도 옆에 나란히 배치) */}
        {editingItemId && (
          <div className="w-[360px] shrink-0 z-20 h-full transition-all">
            <PlanItemDetailDrawer />
          </div>
        )}

      </div>
    </div>
  );
}

export default PlanPage;