import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import * as SpotApi from "@/api/spot";
import type { Spot } from "@/types/spot";
import useUiStore from "@/store/ui.store";

import SpotList from "@/features/spot/components/SpotList";
import SpotHeader from "@/features/spot/components/SpotHeader";
import SpotPremiumBanner from "@/features/spot/components/SpotPremiumBanner";
import CategoryChips from "@/features/spot/components/CategoryChips";
import SpotFilterBar from "@/features/spot/components/SpotFilterBar";
import WidgetBar from "@/components/widgets/WidgetBar";
import { POPULAR_LOCATIONS } from "@/constants/filters";

type SpotMode = "explorer" | "nightlife";
function normalizeMode(contentMode: unknown): SpotMode {
  return contentMode === "nightlife" ? "nightlife" : "explorer";
}

async function apiGetSpots(mode: SpotMode) {
  const mod: any = SpotApi as any;
  const fn = mod.getSpots || mod.fetchSpots || mod.spotsApi?.getSpots;
  if (!fn) return [];

  try {
    const res = await fn({ mode });
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.items)) return res.items;
    return [];
  } catch {
    const res = await fn();
    return Array.isArray(res) ? res : [];
  }
}

const SpotsHome = () => {
  const { contentMode } = useUiStore();
  const mode = normalizeMode(contentMode);

  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [searchTerm, setSearchTerm] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const regionParam = searchParams.get("region");
    const categoryParam = searchParams.get("category");
    const searchParam = searchParams.get("q");

    if (regionParam) setSelectedLocation(regionParam);
    if (categoryParam) setActiveCategory(categoryParam);
    if (searchParam) setSearchTerm(searchParam);
  }, [searchParams]);

  const { data: spots = [], isLoading } = useQuery({
    queryKey: ["spots", mode],
    queryFn: () => apiGetSpots(mode),
  });

  const filteredSpots = useMemo(() => {
    return (spots as Spot[]).filter((spot: Spot) => {
      const s: any = spot as any;

      let matchRegion = true;
      if (selectedLocation) {
        // ✅ 1) 가장 정확한 매칭: locationId
        const spotLocationId = String(s.locationId ?? "").trim();
        if (spotLocationId && spotLocationId === selectedLocation) {
          matchRegion = true;
        } else {
          // ✅ 2) fallback: 레거시 필드 문자열 포함(도시명/주소)
          const targetLocation = POPULAR_LOCATIONS.find((loc) => loc.id === selectedLocation);
          const targetName = targetLocation?.name || selectedLocation;

          const city = (s.city as string | undefined) || (s.location?.city as string | undefined) || "";
          const region = (s.region as string | undefined) || "";
          const address = (s.address as string | undefined) || (s.location?.address as string | undefined) || "";

          matchRegion = city.includes(targetName) || region.includes(targetName) || address.includes(targetName);
        }
      }

      const category = (s.category as string | undefined) || "";
      const matchCategory = activeCategory === "전체" || category === activeCategory;

      const name = (s.name as string | undefined) || "";
      const desc = (s.description as string | undefined) || "";
      const q = searchTerm.trim().toLowerCase();
      const matchSearch = q === "" || name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);

      return matchRegion && matchCategory && matchSearch;
    });
  }, [spots, selectedLocation, activeCategory, searchTerm]);

  const handleLocationChange = (locationId: string | null) => {
    setSelectedLocation(locationId);

    const next = new URLSearchParams(searchParams);
    if (locationId) next.set("region", locationId);
    else next.delete("region");

    setSearchParams(next);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);

    const next = new URLSearchParams(searchParams);
    if (category === "전체") next.delete("category");
    else next.set("category", category);

    setSearchParams(next);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearchTerm(v);

    // ✅ q를 URL에 반영(새로고침/공유/뒤로가기 UX 개선)
    const next = new URLSearchParams(searchParams);
    if (v.trim()) next.set("q", v.trim());
    else next.delete("q");
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSelectedLocation(null);
    setActiveCategory("전체");
    setSearchTerm("");
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      <SpotHeader />

      <main className="container mx-auto px-4 pt-4">
        <div className="mb-6">
          <SpotPremiumBanner mode={mode} />
        </div>

        <div className="mb-8">
          <WidgetBar selectedLocationId={selectedLocation} />
        </div>

        <div className="sticky top-[70px] z-30 -mx-4 px-4 pb-4 pt-2 bg-gray-50/95 dark:bg-black/95 backdrop-blur-md transition-all">
          <SpotFilterBar
            selectedLocation={selectedLocation}
            onSelectLocation={handleLocationChange}
            searchTerm={searchTerm}
            onSearchChange={handleSearch}
            onSearchSubmit={() => {}}
          />
        </div>

        <div className="mb-8 flex justify-center">
          <div className="w-full max-w-5xl overflow-x-auto no-scrollbar py-2">
            {/* ✅ props 정리: onSelect / mode 전달 */}
            <CategoryChips activeCategory={activeCategory} onSelect={handleCategoryChange} mode={mode} />
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              탐색 결과 <span className="text-primary text-xl">{filteredSpots.length}</span>
            </h2>
          </div>

          <div className="min-h-[500px]">
            {filteredSpots.length > 0 ? (
              <SpotList
                spots={filteredSpots}
                isLoading={isLoading}
                onSpotHover={setHoveredSpotId}
                onSpotClick={setSelectedSpotId}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 mx-4">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 text-4xl shadow-inner">
                  🤔
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">조건에 맞는 장소가 없어요</h3>
                <p className="text-gray-500">다른 키워드나 지역으로 검색해보시는 건 어떨까요?</p>
                <button
                  onClick={resetFilters}
                  className="mt-6 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full font-bold hover:opacity-90 transition shadow-lg"
                >
                  필터 초기화
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SpotsHome;
