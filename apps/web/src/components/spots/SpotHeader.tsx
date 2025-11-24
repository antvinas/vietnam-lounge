import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

interface SpotHeaderProps {
  regionLabel: string;
  cityName: string;
  category: string;
  total: number;
  mode?: "explorer" | "nightlife";
}

/** SpotHeader — 카테고리별 감성 문장 자동 전환 */
const SpotHeader = ({
  regionLabel,
  cityName,
  category,
  total,
  mode = "explorer",
}: SpotHeaderProps) => {
  const accent =
    mode === "nightlife"
      ? "text-[#F472B6] bg-[#F472B6]/10"
      : "text-[#2BB6C5] bg-[#2BB6C5]/10";

  let titleText = "";
  if (regionLabel === "전체" || cityName === "전체") {
    titleText = mode === "nightlife" ? "베트남의 Nightlife 스팟" : "베트남의 모든 여행 스팟";
  } else {
    switch (category) {
      case "호텔":
        titleText = `${cityName}의 편안한 휴식 공간`;
        break;
      case "레스토랑":
        titleText = `${cityName}의 맛있는 식사와 레스토랑`;
        break;
      case "카페 & 브런치":
        titleText = `${cityName}의 여유로운 카페와 브런치 공간`;
        break;
      case "스파 & 마사지":
        titleText = `${cityName}의 힐링 스파와 마사지 공간`;
        break;
      case "관광 & 문화":
        titleText = `${cityName}의 여행 명소와 문화 공간`;
        break;
      case "쇼핑":
        titleText = `${cityName}의 쇼핑 스팟과 마켓`;
        break;
      case "액티비티":
        titleText = `${cityName}의 즐길 거리와 액티비티`;
        break;
      case "바":
      case "클럽":
      case "카라오케":
      case "마사지":
        titleText = `${cityName}의 ${category}`;
        break;
      default:
        titleText = `${cityName}의 추천 스팟`;
    }
  }

  const subtitle =
    regionLabel === "전체" || cityName === "전체"
      ? mode === "nightlife"
        ? "밤의 리듬을 따라, 새로운 감각을 경험하세요."
        : "어디로든 떠날 준비가 되었나요? 당신의 여정을 시작해보세요."
      : mode === "nightlife"
      ? "이 도시의 밤을 즐겨보세요. 안전 수칙을 확인하세요."
      : "이 도시의 시간을 즐기며, 당신만의 특별한 하루를 만들어보세요.";

  return (
    <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-10">
      <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${accent}`}>
        <MapPin size={16} />
        {mode === "nightlife" ? "Nightlife Picks" : "Explorer Picks"}
      </div>

      <h1 className="mt-4 text-[40px] font-extrabold leading-tight text-text-main sm:text-[44px] lg:text-[48px]">
        {titleText}
      </h1>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[15px] text-text-secondary">
        <p>{subtitle}</p>
        <span className="mt-2 sm:mt-0 text-sm">
          총 <strong className="font-semibold text-text-main">{total}</strong>개 스팟
        </span>
      </div>
    </motion.header>
  );
};

export default SpotHeader;
