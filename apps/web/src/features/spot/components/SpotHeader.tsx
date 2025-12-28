// apps/web/src/features/spot/components/SpotHeader.tsx
import { motion } from "framer-motion";
import { MapPin, Sun, Moon, Cloud, Star } from "lucide-react";
import { useMemo } from "react";

interface SpotHeaderProps {
  mode?: "explorer" | "nightlife";
  region?: string;
  bgImage?: string;
}

const SpotHeader = ({
  mode = "explorer",
  region = "전체",
  bgImage,
}: SpotHeaderProps) => {
  
  // 1. 시간대별 한국어 감성 멘트
  const { timeIcon, timeGreeting } = useMemo(() => {
    const hour = new Date().getHours();
    let icon = <Sun size={14} />;
    let greeting = "오늘도 즐거운 여행 되세요.";

    if (hour >= 5 && hour < 12) {
      icon = <Sun size={14} className="text-orange-300" />;
      greeting = "상쾌한 아침, 여행을 시작해볼까요?";
    } else if (hour >= 12 && hour < 17) {
      icon = <Cloud size={14} className="text-sky-300" />;
      greeting = "나른한 오후, 잠시 쉬어갈 곳을 찾아보세요.";
    } else if (hour >= 17 && hour < 20) {
      icon = <Star size={14} className="text-purple-300" />;
      greeting = "노을 지는 저녁, 낭만적인 식사는 어때요?";
    } else {
      icon = <Moon size={14} className="text-yellow-300" />;
      greeting = "깊어가는 밤, 도시의 열기를 느껴보세요.";
    }
    return { timeIcon: icon, timeGreeting: greeting };
  }, []);

  const isNight = mode === "nightlife";
  const badgeBg = isNight ? "bg-purple-900/40 text-purple-100" : "bg-black/20 text-white";
  const background = bgImage || (isNight ? "/images/nightlife-bg.jpg" : "/images/daylife-bg.jpg");

  return (
    // 높이를 넉넉히 잡고 하단은 직선 마감
    <div className="relative w-full h-[400px] lg:h-[460px] bg-gray-900">
      {/* 배경 이미지 */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
        style={{ backgroundImage: `url(${background})` }}
      />
      {/* 시네마틱 딤 (단색 오버레이로 깔끔함 유지) */}
      <div className={`absolute inset-0 ${isNight ? 'bg-black/70' : 'bg-black/40'}`} />

      <div className="relative z-10 h-full max-w-[1280px] mx-auto px-5 md:px-8 flex flex-col justify-center pb-16">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          {/* 상단 뱃지 */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md border border-white/10 ${badgeBg}`}>
              <MapPin size={12} />
              {region === "전체" ? "베트남 전역" : region}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-black/30 text-gray-100 backdrop-blur-md border border-white/5">
              {timeIcon}
              {timeGreeting}
            </span>
          </div>

          {/* 메인 타이틀 (한국어) */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-md">
            {region === "전체" ? "베트남," : region}<br />
            {isNight ? "잠들지 않는 화려한 밤." : "특별한 여행이 시작되는 곳."}
          </h1>
          <p className="text-base md:text-lg text-white/80 font-medium max-w-2xl">
            현지인이 추천하는 숨겨진 명소와 맛집을 발견해보세요.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SpotHeader;