import { useState } from "react";
import type { Spot } from "@/types/spot";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

interface Props {
  spot: Spot;
}

const WidgetBlock = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-lg border border-border bg-background-sub shadow-sm">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-2 text-sm font-semibold text-text-main"
      >
        {title}
        {open ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      {open && <div className="px-4 pb-4 text-sm text-text-secondary">{children}</div>}
    </div>
  );
};

const SpotSidebarWidgets = ({ spot }: Props) => {
  return (
    <div className="sticky top-20 space-y-4">
      <WidgetBlock title="내 주변 추천">
        반경 3km 이내 스팟 (추후 API 연동)
      </WidgetBlock>

      <WidgetBlock title="영업 상태">
        {spot.isOpenNow ? "현재 영업중" : "현재 휴무"}
      </WidgetBlock>

      <WidgetBlock title="환율">
        1 USD ≈ 24,000 VND (실시간 API 연동 가능)
      </WidgetBlock>

      <WidgetBlock title="교통">
        Grab / Taxi 이용 가능
      </WidgetBlock>

      <WidgetBlock title="eSIM">
        즉시 개통 가능
      </WidgetBlock>
    </div>
  );
};

export default SpotSidebarWidgets;
