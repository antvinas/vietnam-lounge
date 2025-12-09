// apps/web/src/components/spots/SpotUtilitiesCard.tsx
import { useState } from "react";
import { FiExternalLink, FiBox } from "react-icons/fi";
import WidgetTabs from "@/components/widgets/WidgetTabs";

type Props = {
  spots?: any[];
  mode?: "explorer" | "nightlife";
  className?: string;
};

export default function SpotUtilitiesCard({ spots = [], mode = "explorer", className = "" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <section className={`rounded-3xl border border-border bg-surface p-4 md:p-5 shadow-md ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-main">여행 도구</h3>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background-sub px-3 py-1.5 text-sm font-semibold text-text-main hover:bg-background"
        >
          도구 열기 <FiExternalLink />
        </button>
      </div>

      <p className="mt-1 text-sm text-text-secondary">
        날씨, 환율, 주변 스팟, 영업중 보기, 쿠폰을 한곳에서 확인.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-text-secondary">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background-sub px-3 py-2">
          <FiBox /> 날씨/환율
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background-sub px-3 py-2">
          <FiBox /> 주변/영업중
        </div>
      </div>

      {open && <WidgetTabs spots={spots} mode={mode} onClose={() => setOpen(false)} />}
    </section>
  );
}
