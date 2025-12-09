// src/components/plan/MapToolbar.tsx
// 6단계: Map 상단의 경량 툴바 UI (경로 / 근처 탐색 / 필터 + 더 보기)
import React from "react";
import MapToolbarMoreMenu, {
  MoreMenuItem,
} from "@/features/plan/components/map/MapToolbarMoreMenu";

type LayerKey = "traffic" | "transit" | "bike";

type Props = {
  /** 경로 요약 패널 / 경로 모드 열기 */
  onRequestRoute?: () => void;
  /** 근처 탐색(SearchDock 등) 진입 */
  onNearbySearch?: () => void;
  /** 맵 필터(카테고리, 시간대 등) 패널 열기 */
  onOpenFilter?: () => void;

  /** 맵 레이어 토글 상태 (없으면 내부 로컬 상태 사용) */
  layers?: Partial<Record<LayerKey, boolean>>;
  /** 레이어 토글 콜백: 실제 MapPanel에서 Google Map 레이어 on/off 수행 */
  onToggleLayer?: (key: LayerKey, value: boolean) => void;

  className?: string;
};

export default function MapToolbar({
  onRequestRoute,
  onNearbySearch,
  onOpenFilter,
  layers,
  onToggleLayer,
  className,
}: Props) {
  // 외부에서 상태 안 주면 로컬 상태로만 토글
  const [localLayers, setLocalLayers] = React.useState<{
    traffic: boolean;
    transit: boolean;
    bike: boolean;
  }>({ traffic: false, transit: false, bike: false });

  const effectiveLayers = {
    traffic: layers?.traffic ?? localLayers.traffic,
    transit: layers?.transit ?? localLayers.transit,
    bike: layers?.bike ?? localLayers.bike,
  };

  const handleLayerChange = (key: LayerKey, value: boolean) => {
    if (onToggleLayer) {
      onToggleLayer(key, value);
    } else {
      setLocalLayers((prev) => ({ ...prev, [key]: value }));
    }
  };

  const moreItems: MoreMenuItem[] = [
    {
      key: "traffic",
      label: "실시간 교통 보기",
      checked: !!effectiveLayers.traffic,
      onChange: (next) => handleLayerChange("traffic", next),
    },
    {
      key: "transit",
      label: "대중교통 레이어",
      checked: !!effectiveLayers.transit,
      onChange: (next) => handleLayerChange("transit", next),
    },
    {
      key: "bike",
      label: "자전거/도보 경로 강조",
      checked: !!effectiveLayers.bike,
      onChange: (next) => handleLayerChange("bike", next),
    },
  ];

  const rootClass =
    className ??
    "inline-flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 text-sm shadow-md backdrop-blur dark:border-slate-700 dark:bg-slate-900/90";

  const primaryBtn =
    "rounded-xl border px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800";

  return (
    <div className={rootClass} role="toolbar" aria-label="지도 도구">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={primaryBtn}
          onClick={onRequestRoute}
        >
          경로 요약
        </button>
        <button
          type="button"
          className={primaryBtn}
          onClick={onNearbySearch}
        >
          근처 탐색
        </button>
        <button
          type="button"
          className={primaryBtn}
          onClick={onOpenFilter}
        >
          필터
        </button>
      </div>

      <MapToolbarMoreMenu
        items={moreItems}
        className="ml-1"
        label="레이어"
      />
    </div>
  );
}
