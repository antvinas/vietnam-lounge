import { FiChevronDown } from "react-icons/fi";

interface Props {
  regions: Record<string, string[]>;
  activeRegion: string;
  onRegionChange: (region: string) => void;
  onOpenDrawer: () => void;
}

const SpotFilterBar = ({ regions, activeRegion, onRegionChange, onOpenDrawer }: Props) => {
  return (
    <nav className="flex flex-wrap items-center gap-3" aria-label="지역 필터 선택">
      {Object.keys(regions).map((region) => (
        <button
          key={region}
          onClick={() => onRegionChange(region)}
          aria-pressed={activeRegion === region}
          aria-label={`${region === "north" ? "북부" : region === "central" ? "중부" : "남부"} 선택`}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${
            activeRegion === region
              ? "bg-primary text-white shadow-lg shadow-primary/30"
              : "border border-border text-text-secondary hover:text-text-main dark:border-border/80 dark:text-text-secondary dark:hover:text-text-main"
          }`}
        >
          {region === "north" ? "북부" : region === "central" ? "중부" : "남부"}
        </button>
      ))}

      <button
        onClick={onOpenDrawer}
        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-main dark:border-border/80 dark:text-text-secondary dark:hover:text-text-main"
        aria-label="도시 선택 드로어 열기"
      >
        도시 선택 <FiChevronDown className="text-base" />
      </button>
    </nav>
  );
};

export default SpotFilterBar;
