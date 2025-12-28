// apps/web/src/features/spot/components/CategoryChips.tsx
import { useRef } from "react";
import { SPOT_CATEGORY_CHIPS, type SpotMode } from "@/constants/filters";

interface CategoryChipsProps {
  activeCategory: string;
  onSelect: (category: string) => void;
  mode?: SpotMode;
}

const CategoryChips = ({ activeCategory, onSelect, mode = "explorer" }: CategoryChipsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const categories = SPOT_CATEGORY_CHIPS[mode];

  return (
    <div className="relative w-full">
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto no-scrollbar py-2 px-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;

          return (
            <button
              key={cat}
              onClick={() => onSelect(cat)}
              className={`
                whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 border
                ${
                  isActive
                    ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-black dark:border-white shadow-md transform scale-105"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:text-gray-200"
                }
              `}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 우측 스크롤 힌트 (페이드) */}
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-gray-900 to-transparent pointer-events-none" />
    </div>
  );
};

export default CategoryChips;
