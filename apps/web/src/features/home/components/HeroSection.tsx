// apps/web/src/features/home/components/HeroSection.tsx
import React from "react";
import useUiStore from "@/store/ui.store";
import { FaSearch } from "react-icons/fa";

/**
 * HeroSection
 * - Explorer/Nightlife 모드별 히어로 배경 이미지 분기
 * - public/images/hero/* 로컬 이미지 사용
 */
const HeroSection = () => {
  const { contentMode } = useUiStore();

  const heroConfig = {
    explorer: {
      slogan: "Explore Vietnam by Day",
      subSlogan: "햇살 가득한 해변과 고대 사원, 당신만의 여정을 시작하세요.",
      ctaPrimary: "지금 탐험하기",
      ctaSecondary: "인기 스팟 보기",
      searchPlaceholder: "지역, 스팟, 맛집을 검색해보세요...",
      // ✅ 로컬 히어로 이미지 (public 아래 → /images/hero/..)
      backgroundAsset: "/images/hero/explorer-hero.png",
    },
    nightlife: {
      slogan: "Experience Vietnam After Dark",
      subSlogan: "네온 불빛 아래, 숨겨진 라운지와 클럽을 발견하세요.",
      ctaPrimary: "라운지 입장하기",
      ctaSecondary: "나이트 가이드",
      searchPlaceholder: "클럽, 바, 유흥 정보를 검색해보세요...",
      // ✅ 로컬 히어로 이미지
      backgroundAsset: "/images/hero/nightlife-hero.png",
    },
  };

  const current = heroConfig[contentMode];

  return (
    <div className="relative h-[85vh] min-h-[600px] w-full overflow-hidden text-white">
      {/* 1) 배경 이미지 */}
      <div
        className="absolute inset-0 h-full w-full bg-cover bg-center transition-all duration-1000 ease-in-out transform hover:scale-105"
        style={{ backgroundImage: `url(${current.backgroundAsset})` }}
      />

      {/* 2) 오버레이 (텍스트 가독성) */}
      <div
        className={`absolute inset-0 z-10 transition-colors duration-500 ${
          contentMode === "nightlife"
            ? "bg-gradient-to-t from-black/90 via-black/50 to-purple-900/30"
            : "bg-gradient-to-t from-black/60 via-black/20 to-transparent"
        }`}
      />

      {/* 3) 메인 콘텐츠 */}
      <div className="relative z-20 flex h-full flex-col items-center justify-center px-4 text-center">
        <div className="flex w-full max-w-3xl flex-col items-center animate-fade-in-up">
          {/* 배지 */}
          <span
            className={`mb-6 inline-block rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wider backdrop-blur-md ${
              contentMode === "nightlife"
                ? "bg-violet-500/20 border border-violet-400/50 text-violet-200"
                : "bg-white/20 border border-white/40 text-white"
            }`}
          >
            {contentMode === "nightlife" ? "Nightlife Collection" : "Premium Travel Guide"}
          </span>

          {/* 타이틀 */}
          <h1 className="mb-4 text-5xl font-extrabold leading-tight tracking-tight drop-shadow-2xl md:text-6xl lg:text-7xl">
            Vietnam Lounge
          </h1>

          {/* 슬로건 */}
          <h2 className="mb-2 text-2xl font-bold text-white drop-shadow-lg md:text-3xl">
            {current.slogan}
          </h2>

          <p className="mb-10 text-base text-gray-100 opacity-90 drop-shadow-md md:text-lg">
            {current.subSlogan}
          </p>

          {/* 검색창 */}
          <div className="mb-8 w-full max-w-xl">
            <div className="relative group">
              <div
                className={`absolute -inset-1 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-200 ${
                  contentMode === "nightlife" ? "bg-violet-600" : "bg-emerald-400"
                }`}
              />

              <div className="relative flex items-center rounded-full bg-white/95 p-2 shadow-2xl ring-1 ring-black/5">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none">
                  <FaSearch
                    className={`text-xl ${contentMode === "nightlife" ? "text-violet-500" : "text-gray-400"}`}
                  />
                </div>

                <input
                  type="text"
                  placeholder={current.searchPlaceholder}
                  className="w-full bg-transparent p-3 pl-14 text-gray-800 placeholder:text-gray-400 focus:outline-none text-base"
                />

                <button
                  className={`rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 whitespace-nowrap ${
                    contentMode === "nightlife"
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-600"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500"
                  }`}
                >
                  검색
                </button>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              className={`min-w-[160px] rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl ${
                contentMode === "nightlife"
                  ? "bg-white/10 hover:bg-white/20 border border-white/20"
                  : "bg-emerald-600 hover:bg-emerald-500 border border-transparent"
              }`}
            >
              {current.ctaPrimary}
            </button>

            <button className="min-w-[160px] rounded-xl border border-white/30 bg-black/20 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:-translate-y-1 hover:bg-black/40 hover:border-white/50">
              {current.ctaSecondary}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
