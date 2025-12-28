// apps/web/src/features/spot/components/SpotFilterBar.tsx
import React from 'react';
import LocationFilter from "../../../components/forms/LocationFilter";
import { FiSearch } from "react-icons/fi";

interface Props {
  selectedLocation: string | null;
  onSelectLocation: (locationId: string | null) => void;
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit?: () => void;
}

const SpotFilterBar = ({ 
  selectedLocation, 
  onSelectLocation, 
  searchTerm, 
  onSearchChange,
  onSearchSubmit 
}: Props) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 md:px-0">
      {/* 🚀 통합 검색 바: Shadow와 Rounding을 강조하여 '떠 있는' 느낌 구현 */}
      <div className="relative flex flex-col md:flex-row items-center bg-white dark:bg-gray-800 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-gray-700 p-2 gap-2 transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.15)]">
        
        {/* 1. 지역 선택 (Location Popover) */}
        <div className="w-full md:w-auto relative z-20">
           {/* LocationFilter는 내부적으로 Popover UI를 가짐 */}
           <LocationFilter 
             selectedLocation={selectedLocation} 
             onSelectLocation={onSelectLocation} 
           />
        </div>

        {/* 구분선 (PC에서만 보임) */}
        <div className="hidden md:block w-px h-10 bg-gray-200 dark:bg-gray-700 mx-2"></div>

        {/* 2. 검색어 입력 (Search Input) */}
        <div className="flex-1 w-full relative flex items-center group px-2">
          <div className="absolute left-4 text-gray-400 group-focus-within:text-primary transition-colors">
            <FiSearch size={22} />
          </div>
          <input 
            type="text"
            value={searchTerm}
            onChange={onSearchChange}
            onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit && onSearchSubmit()}
            placeholder="어디로 떠나고 싶으신가요? (맛집, 호텔, 관광지)"
            className="w-full h-14 pl-12 pr-4 bg-transparent border-none focus:ring-0 focus:outline-none text-gray-800 dark:text-gray-100 font-bold placeholder:text-gray-400 placeholder:font-normal text-lg"
          />
        </div>

        {/* 3. 검색 버튼 (Action Button) */}
        <button 
          onClick={onSearchSubmit}
          className="w-full md:w-auto px-8 h-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 md:mr-1"
        >
          <span className="hidden md:inline">검색</span>
          <span className="md:hidden">검색하기</span>
          <FiSearch className="md:hidden" size={20} />
        </button>
      </div>
    </div>
  );
};

export default SpotFilterBar;