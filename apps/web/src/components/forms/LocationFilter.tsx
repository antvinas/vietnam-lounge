// apps/web/src/components/forms/LocationFilter.tsx
import { useState, useRef, useEffect, useMemo } from "react";
import { FiMapPin, FiChevronDown, FiSearch, FiX } from "react-icons/fi";
import { POPULAR_LOCATIONS, REGION_TABS, RegionType } from "../../constants/filters";

interface Props {
  selectedLocation: string | null;
  onSelectLocation: (locationId: string | null) => void;
}

const LocationFilter = ({ selectedLocation, onSelectLocation }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RegionType | "all">("all");
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = POPULAR_LOCATIONS.find((loc) => loc.id === selectedLocation)?.name;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 탭 필터
  const tabFiltered = useMemo(() => {
    return activeTab === "all" ? POPULAR_LOCATIONS : POPULAR_LOCATIONS.filter((loc) => loc.region === activeTab);
  }, [activeTab]);

  // 검색 필터 (name / name_en / id)
  const filteredLocations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tabFiltered;
    return tabFiltered.filter((loc) => {
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.name_en.toLowerCase().includes(q) ||
        loc.id.toLowerCase().includes(q)
      );
    });
  }, [query, tabFiltered]);

  // 팝오버 열 때 검색어 초기화(사용성)
  useEffect(() => {
    if (isOpen) setQuery("");
  }, [isOpen]);

  return (
    <div className="relative z-30" ref={containerRef}>
      {/* 트리거 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 rounded-2xl px-5 py-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-800 w-full md:w-auto ${
          selectedLocation ? "bg-primary/5 ring-1 ring-primary/20" : ""
        }`}
      >
        <div
          className={`rounded-full p-2 transition-colors ${
            selectedLocation ? "bg-primary text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-700"
          }`}
        >
          <FiMapPin className="text-lg" />
        </div>
        <div className="text-left min-w-[100px]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Location</p>
          <p className="text-sm font-bold text-text-main truncate max-w-[120px]">
            {selectedLabel || "어디로 갈까요?"}
          </p>
        </div>
        <FiChevronDown
          className={`ml-2 text-xl text-text-tertiary transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* 팝오버 패널 */}
      {isOpen && (
        <>
          {/* 모바일 배경 */}
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsOpen(false)} />

          {/* 패널 본체 */}
          <div className="fixed bottom-0 left-0 z-50 w-full rounded-t-2xl border-t border-border bg-white shadow-2xl animate-in slide-in-from-bottom md:absolute md:bottom-auto md:left-0 md:top-full md:mt-3 md:w-[600px] md:rounded-2xl md:border md:shadow-xl md:animate-in md:fade-in md:zoom-in-95 dark:border-border/80 dark:bg-gray-900">
            {/* 헤더 (모바일) */}
            <div className="flex items-center justify-between border-b border-border p-4 md:hidden">
              <h3 className="font-bold text-text-main">여행지 선택</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 text-text-tertiary">
                <FiX className="text-xl" />
              </button>
            </div>

            {/* 탭 영역 */}
            <div className="flex border-b border-border bg-gray-50/50 p-1 dark:border-border/80 dark:bg-gray-800/50 md:rounded-t-2xl overflow-x-auto no-scrollbar">
              {REGION_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[60px] rounded-lg py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white text-primary shadow-sm dark:bg-gray-700 dark:text-white"
                      : "text-text-tertiary hover:bg-gray-100 hover:text-text-main dark:hover:bg-gray-700/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ✅ 검색 입력(실제 작동) */}
            <div className="px-5 pt-4">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 dark:border-border/80 dark:bg-gray-900">
                <FiSearch className="text-text-tertiary" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="하노이 / Hanoi / hanoi 처럼 검색"
                  className="w-full bg-transparent outline-none text-sm text-text-main placeholder:text-text-tertiary"
                />
                {query ? (
                  <button onClick={() => setQuery("")} className="p-1 text-text-tertiary hover:text-text-main">
                    <FiX />
                  </button>
                ) : null}
              </div>
            </div>

            {/* 지역 리스트 그리드 */}
            <div className="p-5 max-h-[60vh] overflow-y-auto md:max-h-[400px]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    onSelectLocation(null);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-center rounded-xl border border-dashed border-border py-3 text-sm font-medium text-text-secondary transition hover:border-primary hover:text-primary ${
                    !selectedLocation ? "border-primary bg-primary/5 text-primary" : ""
                  }`}
                >
                  전체 지역 보기
                </button>

                {filteredLocations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => {
                      onSelectLocation(loc.id);
                      setIsOpen(false);
                    }}
                    className={`group relative flex flex-col items-start justify-center rounded-xl border px-4 py-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5 ${
                      selectedLocation === loc.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border dark:border-border/80"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-sm font-bold ${selectedLocation === loc.id ? "text-primary" : "text-text-main"}`}>
                        {loc.name}
                      </span>
                      {loc.type === "spot" && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded dark:bg-green-900/30 dark:text-green-300">
                          명소
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-text-tertiary group-hover:text-primary/70 font-medium mt-0.5">
                      {loc.name_en}
                    </span>
                  </button>
                ))}
              </div>

              {filteredLocations.length === 0 ? (
                <div className="text-center text-sm text-text-tertiary py-10">검색 결과가 없습니다.</div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LocationFilter;
