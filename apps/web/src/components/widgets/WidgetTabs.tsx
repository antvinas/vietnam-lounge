// apps/web/src/components/widgets/WidgetTabs.tsx
import { useState } from "react";
import { Tab } from "@headlessui/react";
import CouponCard from "./CouponCard";

// 🟢 Props 타입 정의
interface Props {
  spots?: any[];
  mode?: string;
  onClose?: () => void;
}

const categories = {
  "추천": [],
  "인기": [],
  "최신": [],
};

export default function WidgetTabs({ spots, mode, onClose }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="w-full px-2 py-4 sm:px-0">
      <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          {Object.keys(categories).map((category) => (
            <Tab
              key={category}
              // 🟢 [수정] selected 타입 명시
              className={({ selected }: { selected: boolean }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700
                 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2
                 ${selected ? "bg-white shadow" : "text-blue-100 hover:bg-white/[0.12] hover:text-white"}`
              }
            >
              {category}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-2">
          <Tab.Panel className="rounded-xl bg-white p-3">
            <div className="flex gap-4 overflow-x-auto pb-4">
              <CouponCard 
                title="웰컴 쿠폰" 
                description="신규 가입 10% 할인" 
                partnerName="VN Lounge"
                partnerLogo="/logo.png"
                discount="10%"
              />
              <CouponCard 
                title="주말 핫딜" 
                description="토·일 한정 추가 5%" 
                partnerName="Spa Day"
                partnerLogo=""
                discount="5%"
              />
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}