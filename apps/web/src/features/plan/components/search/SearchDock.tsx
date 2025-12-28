// apps/web/src/features/plan/components/search/SearchDock.tsx
import { useState } from "react";
import { FiSearch, FiHeart, FiInbox, FiLoader } from "react-icons/fi";
import { useQuery } from "@tanstack/react-query";
import SearchAutocomplete from "@/features/plan/components/search/SearchAutocomplete";
import SearchResultList from "@/features/plan/components/search/SearchResultList";
import { usePlacesAutocomplete } from "@/hooks/useGooglePlaces";
import { getMyFavorites } from "@/features/User/api/user.api";
import type { LatLng } from "@/components/map/types";

export default function SearchDock({ height = 560 }: { height?: number }) {
  const [activeTab, setActiveTab] = useState<"search" | "saved">("search");

  // center 값을 읽지는 않아서 setter만 사용
  const [, setCenter] = useState<LatLng>({ lat: 21.0278, lng: 105.8342 });

  // 1. 검색 로직
  const [query, setQuery] = useState("");
  const { predictions } = usePlacesAutocomplete(query, { debounceMs: 200 });

  // 2. 찜 목록 로직 (실제 API)
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favoriteSpots"],
    queryFn: getMyFavorites,
    enabled: activeTab === "saved",
  });

  // 검색 결과 포맷팅
  const searchResults = predictions.map((p) => ({
    id: p.placeId,
    name: p.primaryText || p.description,
    address: p.secondaryText,
    raw: p,
  }));

  // 찜 목록 포맷팅 (SearchResultList 호환)
  const savedResults = favorites.map((f) => ({
    id: f.id,
    name: f.name,
    address: f.address,
    lat: (f as any).latitude,
    lng: (f as any).longitude,
    rating: f.rating,
    isSaved: true,
  }));

  return (
    <aside
      className="flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl"
      style={{ height }}
    >
      {/* 탭 */}
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("search")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === "search"
              ? "text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <FiSearch size={14} /> Search
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            activeTab === "saved"
              ? "text-pink-500 border-b-2 border-pink-500 bg-pink-50/50 dark:bg-pink-900/10"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <FiHeart
            size={14}
            className={activeTab === "saved" ? "fill-pink-500" : ""}
          />{" "}
          Saved
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 검색 모드 */}
        {activeTab === "search" && (
          <>
            <div className="p-4 pb-2">
              <SearchAutocomplete
                value={query}
                onChange={setQuery}
                suggestions={predictions.map((p) => ({
                  id: p.placeId,
                  primary: p.primaryText || p.description,
                  secondary: p.secondaryText,
                  raw: p,
                }))}
                placeholder="장소 검색 (예: 롯데호텔)"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
              <SearchResultList
                // @ts-ignore
                items={searchResults}
                origin={null}
                onAdd={() => {}}
                onDirections={(p: any) => setCenter({ lat: p.lat, lng: p.lng })}
              />
            </div>
          </>
        )}

        {/* 저장 모드 */}
        {activeTab === "saved" && (
          <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <FiLoader className="animate-spin text-xl" />
                <span className="text-xs">로딩 중...</span>
              </div>
            ) : favorites.length > 0 ? (
              <SearchResultList
                // @ts-ignore
                items={savedResults}
                origin={null}
                onAdd={() => {}}
                onDirections={(p: any) => setCenter({ lat: p.lat, lng: p.lng })}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 space-y-2 opacity-60">
                <FiInbox size={32} />
                <p className="text-sm font-medium">저장된 장소가 없습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
