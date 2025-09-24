import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { FiFilter, FiMap, FiX } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import { fetchSpots } from "@/api/spots.api";
import SpotWidgetsPanel from "@/components/spots/SpotWidgetsPanel";
import type { Spot } from "@/types/spot";
import MapView from "@/components/common/MapView";
import SpotList from "@/components/spots/SpotList";
import useUiStore from "@/store/ui.store";

const PAGE_PADDING = "px-4 md:px-10 lg:px-20";

// 🔹 카테고리 확장
const filterOptions = [
  { label: "전체", value: "all" },
  { label: "호텔", value: "hotel" },
  { label: "레스토랑", value: "restaurant" },
  { label: "카페 & 브런치", value: "cafe" },
  { label: "나이트라이프", value: "nightlife" },
  { label: "스파 & 마사지", value: "spa" },
  { label: "관광 & 문화", value: "culture" },
  { label: "쇼핑", value: "shopping" },
  { label: "액티비티", value: "activity" },
] as const;

const filterKeywords: Record<(typeof filterOptions)[number]["value"], string[]> =
  {
    all: [],
    hotel: ["hotel", "숙소", "리조트", "게스트하우스"],
    restaurant: ["restaurant", "레스토랑", "food", "맛집"],
    cafe: ["cafe", "카페", "브런치", "coffee"],
    nightlife: ["nightlife", "bar", "클럽", "루프탑"],
    spa: ["spa", "마사지", "wellness", "힐링"],
    culture: ["tour", "culture", "museum", "heritage", "관광", "문화"],
    shopping: ["shopping", "mall", "market", "쇼핑", "시장"],
    activity: ["activity", "체험", "투어", "액티비티"],
  };

// 🔹 지역 옵션
const regionOptions = [
  { label: "전체 베트남", value: "all" },
  { label: "북부 - 하노이", value: "hanoi" },
  { label: "북부 - 닌빈", value: "ninhbinh" },
  { label: "북부 - 하롱베이", value: "halong" },
  { label: "북부 - 하이퐁", value: "haiphong" },
  { label: "중부 - 다낭", value: "danang" },
  { label: "중부 - 호이안", value: "hoian" },
  { label: "중부 - 달랏", value: "dalat" },
  { label: "남부 - 호치민", value: "hochiminh" },
  { label: "남부 - 푸꾸옥", value: "phuquoc" },
] as const;

const SpotsHome = () => {
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [isMapOverlayOpen, setIsMapOverlayOpen] = useState(false);

  // ✅ zustand store 연동
  const { contentMode, region, category, setRegion, setCategory } = useUiStore();

  // ✅ URL 상태와 동기화
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const urlRegion =
      (searchParams.get("region") as (typeof regionOptions)[number]["value"]) ||
      "all";
    const urlCategory =
      (searchParams.get("category") as (typeof filterOptions)[number]["value"]) ||
      "all";

    if (urlRegion !== region) setRegion(urlRegion);
    if (urlCategory !== category) setCategory(urlCategory);
  }, [searchParams, region, category, setRegion, setCategory]);

  const { data: spots, isLoading, error } = useQuery<Spot[]>({
    queryKey: ["spots", contentMode, region, category],
    queryFn: () => fetchSpots(contentMode, { region, category }),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    document.body.style.overflow = isMapOverlayOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMapOverlayOpen]);

  const filteredSpots = useMemo(() => {
    if (!spots) return [];

    let result = spots;

    if (region !== "all") {
      result = result.filter(
        (spot) =>
          spot.region?.toLowerCase() === region.toLowerCase() ||
          spot.city?.toLowerCase() === region.toLowerCase()
      );
    }

    if (category !== "all") {
      const keywords = filterKeywords[category];
      result = result.filter((spot) => {
        const tokens = [
          spot.category,
          spot.city,
          spot.region,
          ...(spot.tags || []),
          ...(spot.keywords || []),
        ]
          .filter(Boolean)
          .map((t) => t.toLowerCase());
        return keywords.some((kw) =>
          tokens.some((tk) => tk.includes(kw.toLowerCase()))
        );
      });
    }

    return result;
  }, [spots, region, category]);

  const validSpots = useMemo(
    () =>
      filteredSpots.filter(
        (s) => typeof s.latitude === "number" && typeof s.longitude === "number"
      ),
    [filteredSpots]
  );

  const accentButtonClass =
    contentMode === "nightlife"
      ? "bg-[#8B5CF6] text-white hover:bg-[#7C3AED]"
      : "bg-[#2BB6C5] text-white hover:bg-[#26A3B2]";

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        오류 발생: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-screen-2xl ${PAGE_PADDING} pb-16`}>
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-10">
        {/* 지도 + 위젯 (데스크탑) */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 lg:pt-6">
          <div className="sticky top-24 flex h-[calc(100vh-6rem)] w-full flex-col gap-6">
            <div className="flex-[1.6] overflow-hidden rounded-3xl bg-background-sub shadow-xl ring-1 ring-border/60">
              <MapView
                spots={validSpots}
                hoveredSpotId={hoveredSpotId}
                mode={contentMode}
                className="h-full"
                onSpotSelect={(id) => setSelectedSpotId(id)}
              />
            </div>
            <div className="flex-[1] overflow-y-auto pr-1">
              <SpotWidgetsPanel spots={filteredSpots} mode={contentMode} />
            </div>
          </div>
        </div>

        {/* 카드 리스트 */}
        <div className="lg:col-span-7 xl:col-span-8">
          <header className="pb-8 pt-10 lg:pt-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-background-sub px-4 py-2 text-sm font-medium text-text-secondary shadow-sm">
                  <FiFilter className="text-lg" />
                  {contentMode === "nightlife"
                    ? "Nightlife Picks"
                    : "Explorer Picks"}
                </div>
                <div>
                  <h1 className="text-[40px] font-bold leading-tight text-text-main sm:text-[44px] lg:text-[48px]">
                    {region === "all"
                      ? "베트남 전체 스팟"
                      : `${
                          regionOptions.find((r) => r.value === region)?.label
                        } 스팟`}
                  </h1>
                  <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-text-secondary">
                    북적이는 도시부터 고요한 자연까지, 테마와 지역 필터로 원하는
                    스팟을 빠르게 찾을 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden text-sm font-medium text-text-secondary lg:inline">
                  총 {filteredSpots.length}개 스팟
                </span>
                <button
                  type="button"
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold lg:hidden ${accentButtonClass}`}
                  onClick={() => setIsMapOverlayOpen(true)}
                >
                  <FiMap className="text-base" />
                  지도 보기
                </button>
              </div>
            </div>

            {/* 지역 필터 */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {regionOptions.map(({ label, value }) => {
                const isActive = region === value;
                const activeClass =
                  contentMode === "nightlife"
                    ? "bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/40"
                    : "bg-[#2BB6C5] text-white shadow-lg shadow-[#2BB6C5]/30";
                return (
                  <button
                    key={value}
                    onClick={() => {
                      setRegion(value);
                      setSearchParams({ region: value, category });
                    }}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                      isActive
                        ? activeClass
                        : "border-border bg-transparent text-text-secondary hover:text-text-main"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* 카테고리 필터 */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {filterOptions.map(({ label, value }) => {
                const isActive = category === value;
                const activeClass =
                  contentMode === "nightlife"
                    ? "bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/40"
                    : "bg-[#2BB6C5] text-white shadow-lg shadow-[#2BB6C5]/30";
                return (
                  <button
                    key={value}
                    onClick={() => {
                      setCategory(value);
                      setSearchParams({ region, category: value });
                    }}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                      isActive
                        ? activeClass
                        : "border-border bg-transparent text-text-secondary hover:text-text-main"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-main"
              >
                <FiFilter className="text-base" />
                세부 필터
              </button>
            </div>
          </header>

          {/* 모바일 위젯 */}
          <div className="mt-10 space-y-6 lg:hidden">
            <SpotWidgetsPanel spots={filteredSpots} mode={contentMode} />
          </div>

          {/* 카드 리스트 */}
          <section aria-labelledby="recommended-spots" className="pb-12">
            <div className="mb-6">
              <h2
                id="recommended-spots"
                className="text-[28px] font-semibold text-text-main"
              >
                추천 스팟
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                카드 hover 시 지도에서 위치가 하이라이트 되고, 지도 마커 클릭 시
                해당 카드가 강조됩니다.
              </p>
            </div>

            <SpotList
              spots={filteredSpots}
              hoveredSpotId={hoveredSpotId}
              setHoveredSpotId={setHoveredSpotId}
              selectedSpotId={selectedSpotId}
              isLoading={isLoading}
            />
          </section>
        </div>
      </div>

      {/* 모바일 지도 오버레이 */}
      {isMapOverlayOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMapOverlayOpen(false)}
          />
          <div className="relative z-50 m-4 w-full max-w-3xl overflow-hidden rounded-3xl bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-[22px] font-semibold text-text-main">
                  지도에서 보기
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  마커를 탭하면 상세 페이지로 이동할 수 있어요.
                </p>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-lg text-text-main hover:bg-black/10"
                onClick={() => setIsMapOverlayOpen(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="h-[70vh] min-h-[360px] w-full">
              <MapView
                spots={validSpots}
                hoveredSpotId={hoveredSpotId}
                mode={contentMode}
                onSpotSelect={(id) => setSelectedSpotId(id)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotsHome;
