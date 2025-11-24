// src/components/home/HeroSection.tsx
import React from "react";
import useUiStore from "@/store/ui.store";
import { FaSearch } from "react-icons/fa";

/**
 * HeroSection — 비디오/이미지 배경 + 다크모드 오버레이
 */
const HeroSection = () => {
  const { contentMode, themeMode } = useUiStore();

  const heroConfig: Record<
    "explorer" | "nightlife",
    {
      slogan: string;
      ctaPrimary: string;
      ctaSecondary?: string;
      searchPlaceholder: string;
      backgroundAsset: string;
      backgroundType: "video" | "image";
    }
  > = {
    explorer: {
      slogan: "Explore Vietnam by Day",
      ctaPrimary: "지금 탐험하기",
      // 커뮤니티 제거에 따라 문구/행동 교체
      ctaSecondary: "인기 스팟 보기",
      searchPlaceholder: "지역, 스팟, 맛집을 검색해보세요...",
      backgroundAsset: "/assets/hero.mp4",
      backgroundType: "video",
    },
    nightlife: {
      slogan: "Experience Vietnam After Dark",
      ctaPrimary: "라운지 입장하기",
      // 커뮤니티 제거에 따라 문구/행동 교체
      ctaSecondary: "나이트 가이드 보기",
      searchPlaceholder: "클럽, 바, 유흥 정보를 검색해보세요...",
      backgroundAsset:
        "https://images.unsplash.com/photo-1531844229379-b84b5c7f884b?w=1200",
      backgroundType: "image",
    },
  };

  const current = heroConfig[contentMode];
  const isDark = themeMode === "dark";

  return (
    <div className="relative h-[80vh] min-h-[500px] overflow-hidden text-white">
      {/* === Background === */}
      {current.backgroundType === "video" ? (
        <video
          key={current.backgroundAsset}
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-1/2 left-1/2 z-0 h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover"
        >
          <source src={current.backgroundAsset} type="video/mp4" />
        </video>
      ) : (
        <div
          className="absolute top-0 left-0 z-0 h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${current.backgroundAsset})` }}
        />
      )}

      {/* === Overlay === */}
      <div
        className={`absolute inset-0 z-10 ${
          isDark
            ? "bg-gradient-to-t from-black/60 via-black/40 to-transparent"
            : "bg-gradient-to-t from-black/45 via-black/20 to-transparent"
        }`}
      />

      {/* === Content === */}
      <div className="relative z-20 flex h-full flex-col items-center justify-center p-4 text-center">
        <div className="flex w-full max-w-2xl flex-col items-center">
          <h1 className="mb-3 text-4xl font-bold drop-shadow-lg md:text-6xl">
            Vietnam Lounge
          </h1>

          <p className="mb-6 text-lg text-gray-200 drop-shadow-md md:text-xl">
            {current.slogan}
          </p>

          {/* Search */}
          <div className="mb-5 w-full max-w-xl rounded-full bg-white/20 p-1.5 shadow-card backdrop-blur-sm">
            <div className="relative">
              <input
                type="text"
                placeholder={current.searchPlaceholder}
                className="w-full rounded-full bg-transparent p-3 pl-6 pr-12 text-white placeholder:text-gray-200 focus:outline-none"
              />
              <FaSearch className="absolute right-5 top-1/2 -translate-y-1/2 text-xl text-white/80" />
            </div>
          </div>

          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
            <button className="transform rounded-full bg-primary px-8 py-3 font-bold text-white transition-all duration-240 hover:scale-105 hover:opacity-90">
              {current.ctaPrimary}
            </button>
            {current.ctaSecondary ? (
              <button className="rounded-full border-2 border-white/80 px-8 py-3 font-bold text-white transition-colors duration-240 hover:bg-white/10">
                {current.ctaSecondary}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
