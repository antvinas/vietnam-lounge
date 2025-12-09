import { useState } from "react";
import { createPortal } from "react-dom";
import {
  FiSun,
  FiRefreshCw,
  FiMapPin,
  FiClock,
  FiGift,
  FiX,
} from "react-icons/fi";
import WeatherWidget from "@/components/widgets/WeatherWidget";
import ExchangeRateWidget from "@/components/widgets/ExchangeRateWidget";
import NearbyWidget from "@/components/widgets/NearbyWidget";
import OpenNowWidget from "@/components/widgets/OpenNowWidget";
import CouponCard from "@/components/widgets/CouponCard";

interface WidgetTabsProps {
  spots?: any[];
  mode?: "explorer" | "nightlife";
  onClose?: () => void;
}

/**
 * ✅ WidgetTabs — overlay 제거, 닫기 정상작동, 상호작용 가능
 */
const WidgetTabs = ({ spots = [], mode = "explorer", onClose }: WidgetTabsProps) => {
  const [activeTab, setActiveTab] =
    useState<"weather" | "exchange" | "nearby" | "open" | "coupon">("weather");

  const accent =
    mode === "nightlife"
      ? "from-[#6D28D9] to-[#7C3AED]"
      : "from-[#2BB6C5] to-[#20A9B8]";

  const TAB_LIST = [
    { key: "weather", label: "날씨", icon: <FiSun /> },
    { key: "exchange", label: "환율", icon: <FiRefreshCw /> },
    { key: "nearby", label: "주변", icon: <FiMapPin /> },
    { key: "open", label: "영업중", icon: <FiClock /> },
    { key: "coupon", label: "쿠폰", icon: <FiGift /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "weather":
        return <WeatherWidget />;
      case "exchange":
        return <ExchangeRateWidget />;
      case "nearby":
        return <NearbyWidget spots={spots} />;
      case "open":
        return <OpenNowWidget spots={spots} />;
      case "coupon":
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            <CouponCard title="웰컴 쿠폰" description="신규 가입 10% 할인" />
            <CouponCard title="주말 핫딜" description="토·일 한정 추가 5%" />
            <CouponCard title="앱 전용" description="앱 결제 시 3% 할인" />
          </div>
        );
      default:
        return null;
    }
  };

  const element = (
    <div
      className="fixed right-6 top-1/2 -translate-y-1/2 z-[9999] w-[min(92vw,380px)] rounded-2xl border border-border bg-surface/98 shadow-2xl backdrop-blur-md flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/60">
        <span className="font-semibold text-text-main text-[15px]">유틸리티</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose?.(); // ← 여기서 SpotsHome의 setIsWidgetOpen(false) 실행
          }}
          className="flex items-center justify-center rounded-full border border-border p-1.5 hover:bg-background-sub transition"
        >
          <FiX className="text-lg text-text-secondary hover:text-text-main" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-start gap-2 px-4 pt-3 pb-2 border-b border-border bg-background/30">
        {TAB_LIST.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.key
                ? `bg-gradient-to-r ${accent} text-white shadow-md`
                : "bg-background-sub text-text-secondary hover:bg-background"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-500/40 scrollbar-track-transparent">
        {renderContent()}
      </div>
    </div>
  );

  return createPortal(element, document.body);
};

export default WidgetTabs;
