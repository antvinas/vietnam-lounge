import type { Spot } from "@/types/spot";
import { FaClock, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

interface OpeningHoursWidgetProps {
  spot: Spot;
}

const OpeningHoursWidget = ({ spot }: OpeningHoursWidgetProps) => {
  const { isOpenNow, operatingHours } = spot;

  const renderStatus = () => {
    if (isOpenNow === undefined || isOpenNow === null) {
      return (
        <div className="flex items-center gap-2 text-sm text-yellow-600">
          <FaClock />
          <span>영업 정보 확인 필요</span>
        </div>
      );
    }
    return isOpenNow ? (
      <div className="flex items-center gap-2 text-sm font-bold text-green-600">
        <FaCheckCircle />
        <span>현재 영업 중</span>
      </div>
    ) : (
      <div className="flex items-center gap-2 text-sm font-bold text-red-600">
        <FaTimesCircle />
        <span>영업 종료</span>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <h3 className="mb-3 text-lg font-bold text-text-main">영업 시간</h3>
      <div className="space-y-3">
        <div className="font-semibold">{renderStatus()}</div>
        {operatingHours && (
          <p className="whitespace-pre-line text-sm text-text-secondary">
            {operatingHours.replace(/, /g, "\n")}
          </p>
        )}
      </div>
    </div>
  );
};

export default OpeningHoursWidget;
