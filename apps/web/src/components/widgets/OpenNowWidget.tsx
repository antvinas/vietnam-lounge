// src/components/widgets/OpenNowWidget.tsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { FaClock, FaChevronRight } from "react-icons/fa";
import { useSpotsQuery } from "@/features/spot/hooks/useSpotsQuery";
import useUiStore from "@/store/ui.store";

interface Props {
  max?: number;
}

export default function OpenNowWidget({ max = 3 }: Props) {
  // useSpotsQuery 수정본을 적용했다면 spots가 정상적으로 나옵니다.
  const { spots } = useSpotsQuery(); 
  const { contentMode } = useUiStore();
  const isNight = contentMode === "nightlife";

  const openSpots = useMemo(() => {
    if (!spots) return [];
    // isOpenNow가 true인 스팟 필터링 (타입 정의에 추가했으므로 에러 안 남)
    return spots.filter((s) => s.isOpenNow).slice(0, max);
  }, [spots, max]);

  if (openSpots.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
      
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FaClock />
          지금 영업 중
        </h3>
        <Link to="/spots" className="text-xs font-medium bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition">
          더보기
        </Link>
      </div>

      <div className="space-y-3 relative z-10">
        {openSpots.map((spot) => (
          <Link 
            key={spot.id} 
            to={isNight ? `/adult/spots/${spot.id}` : `/spots/${spot.id}`}
            className="block bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:bg-white/20 transition group"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-sm truncate pr-2">{spot.name}</div>
                <div className="text-xs text-blue-100 mt-0.5">
                  {/* 오류 해결: operatingHours 오타 수정 및 호환성 처리 */}
                  {spot.operatingHours || (Array.isArray(spot.openingHours) ? "영업 시간 확인" : "오늘 영업 중")}
                </div>
              </div>
              <FaChevronRight className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[10px]" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}