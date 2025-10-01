import { FiX } from "react-icons/fi";
import { regionOptions } from "@/pages/Spots/SpotsHome"; // 재사용
import { filterOptions } from "@/pages/Spots/SpotsHome"; // 재사용
import useUiStore from "@/store/ui.store";
import useUrlState from "@/hooks/useUrlState";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: Props) {
  const { region, category, setRegion, setCategory } = useUiStore();
  const { setUrlState } = useUrlState();

  if (!isOpen) return null;

  const handleRegionChange = (value: string) => {
    setRegion(value);
    setUrlState({ region: value, category });
    onClose();
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setUrlState({ region, category: value });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative ml-auto flex h-full w-80 flex-col bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold">필터 선택</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* 지역 선택 */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="mb-2 text-sm font-medium text-text-secondary">지역</h3>
          <div className="flex flex-col gap-2">
            {regionOptions.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleRegionChange(value)}
                className={`rounded-lg px-4 py-2 text-left text-sm font-medium ${
                  region === value
                    ? "bg-primary text-white"
                    : "bg-background-sub text-text-secondary hover:bg-black/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 카테고리 선택 */}
          <h3 className="mb-2 mt-6 text-sm font-medium text-text-secondary">
            카테고리
          </h3>
          <div className="flex flex-col gap-2">
            {filterOptions.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleCategoryChange(value)}
                className={`rounded-lg px-4 py-2 text-left text-sm font-medium ${
                  category === value
                    ? "bg-primary text-white"
                    : "bg-background-sub text-text-secondary hover:bg-black/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
