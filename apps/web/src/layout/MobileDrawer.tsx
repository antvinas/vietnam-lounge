import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import { regionOptions, filterOptions } from "@/constants/filters";
import useUiStore from "@/store/ui.store";
import useUrlState from "@/hooks/useUrlState";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: Props) {
  const { region, category, setRegion, setCategory } = useUiStore();
  const { setUrlState } = useUrlState();

  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = "mobile-drawer-title";

  // ESC, 포커스 관리
  useEffect(() => {
    if (!isOpen) return;
    const prevActive = document.activeElement as HTMLElement | null;

    (closeBtnRef.current ?? panelRef.current)?.focus();

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const container = panelRef.current;
        if (!container) return;
        const focusables = container.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const current = document.activeElement as HTMLElement | null;

        if (!e.shiftKey && current === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && current === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeydown, true);
    return () => {
      document.removeEventListener("keydown", handleKeydown, true);
      prevActive?.focus?.();
    };
  }, [isOpen, onClose]);

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
    <div
      className="fixed inset-0 z-50 flex lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="오버레이 클릭으로 닫기"
      />

      {/* Drawer panel */}
      <div
        ref={panelRef}
        className="relative ml-auto flex h-full w-80 flex-col bg-surface shadow-2xl outline-none"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id={titleId} className="text-lg font-semibold">필터 선택</h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="드로어 닫기"
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
                aria-pressed={region === value}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 카테고리 선택 */}
          <h3 className="mb-2 mt-6 text-sm font-medium text-text-secondary">카테고리</h3>
          <div className="flex flex-col gap-2">
            {filterOptions.tags.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleCategoryChange(value)}
                className={`rounded-lg px-4 py-2 text-left text-sm font-medium ${
                  category === value
                    ? "bg-primary text-white"
                    : "bg-background-sub text-text-secondary hover:bg-black/5"
                }`}
                aria-pressed={category === value}
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
