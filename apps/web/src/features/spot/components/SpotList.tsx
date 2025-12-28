import type { Spot } from "@/types/spot";
import SpotCard from "./SpotCard";
import { FiInbox } from "react-icons/fi";

interface SpotListProps {
  spots: Spot[];
  isLoading: boolean;
  onSpotHover?: (id: string | null) => void;
  onSpotClick?: (id: string | null) => void;
}

const SpotList = ({ spots, isLoading, onSpotHover, onSpotClick }: SpotListProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse" />
            <div className="h-5 w-2/3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!spots.length) {
    return (
      <div className="py-20 text-center border-t border-b border-dashed border-gray-200 dark:border-gray-800">
        <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
          <FiInbox size={24} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">조건에 맞는 장소가 없습니다</h3>
        <p className="text-gray-500 text-sm mt-1">다른 지역이나 카테고리를 선택해보세요.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
      {spots.map((spot, idx) => (
        <SpotCard
          key={spot.id}
          spot={spot}
          featured={idx === 0} // 첫 번째 아이템 크게 (벤토 스타일)
          onHover={onSpotHover}
          onClick={onSpotClick as any}
        />
      ))}
    </div>
  );
};

export default SpotList;
