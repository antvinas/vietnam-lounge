import { useState } from "react";
import WidgetTabs from "@/components/widgets/WidgetTabs";
import type { Spot } from "@/types/spot";

interface SpotWidgetsPanelProps {
  spots: Spot[];
  mode: "explorer" | "nightlife";
  className?: string;
}

const SpotWidgetsPanel = ({ spots, mode, className = "" }: SpotWidgetsPanelProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {!open ? (
        <button
          aria-label="유틸리티 열기"
          onClick={() => setOpen(true)}
          className="self-end rounded-full border border-border bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          유틸리티 열기
        </button>
      ) : null}

      {open ? (
        <WidgetTabs spots={spots} mode={mode} onClose={() => setOpen(false)} />
      ) : (
        <p className="text-sm text-text-secondary">원하는 정보를 보려면 ‘유틸리티 열기’를 누르세요.</p>
      )}
    </div>
  );
};

export default SpotWidgetsPanel;
