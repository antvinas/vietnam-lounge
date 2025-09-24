import { useState } from "react";
import type { Spot } from "@/types/spot";
import RelatedSpots from "./RelatedSpots";
import MapWidget from "./MapWidget";
import OpeningHoursWidget from "./OpeningHoursWidget";
import { FiX, FiSidebar } from "react-icons/fi";

interface SpotSidebarProps {
  spot: Spot;
  recommendations?: Spot[];
  mode: "explorer" | "nightlife";
}

const SpotSidebar = ({ spot, recommendations, mode }: SpotSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* ✅ 데스크탑 사이드바 */}
      <aside className="hidden lg:flex lg:sticky lg:top-24 lg:flex-col lg:gap-6">
        <MapWidget spot={spot} />
        <OpeningHoursWidget spot={spot} />

        {recommendations && recommendations.length > 0 && (
          <RelatedSpots spots={recommendations} mode={mode} />
        )}

        <div className="rounded-lg bg-surface p-4 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold">날씨/대체플랜</h3>
          <p className="text-sm text-text-secondary">위젯 준비 중</p>
        </div>
        <div className="rounded-lg bg-surface p-4 shadow-sm">
          <h3 className="mb-2 text-lg font-semibold">환율/교통/eSIM</h3>
          <p className="text-sm text-text-secondary">위젯 준비 중</p>
        </div>
      </aside>

      {/* ✅ 모바일: 토글 버튼 */}
      <div className="fixed bottom-5 right-5 z-40 lg:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg"
        >
          <FiSidebar className="text-lg" /> 사이드바
        </button>
      </div>

      {/* ✅ 모바일 Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[90%] w-full overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-semibold">스팟 사이드바</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-lg text-text-main hover:bg-black/10"
              >
                <FiX />
              </button>
            </div>

            {/* 기존 사이드바 위젯들 */}
            <div className="flex flex-col gap-6">
              <MapWidget spot={spot} />
              <OpeningHoursWidget spot={spot} />

              {recommendations && recommendations.length > 0 && (
                <RelatedSpots spots={recommendations} mode={mode} />
              )}

              <div className="rounded-lg bg-surface p-4 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold">날씨/대체플랜</h3>
                <p className="text-sm text-text-secondary">위젯 준비 중</p>
              </div>
              <div className="rounded-lg bg-surface p-4 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold">환율/교통/eSIM</h3>
                <p className="text-sm text-text-secondary">위젯 준비 중</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SpotSidebar;
