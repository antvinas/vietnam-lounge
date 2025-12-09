// /apps/web/src/pages/Spots/SpotsHome.tsx
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useCallback } from "react";
import { FiFilter } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import { fetchSpots } from "@/api/spots.api";
import type { Spot } from "@/types/spot";
import SpotMap from "@/features/spot/components/SpotMap";
import SpotList from "@/features/spot/components/SpotList";
import useUiStore from "@/store/ui.store";
import FilterDrawer from "@/features/spot/components/FilterDrawer";
import SpotHeader from "@/features/spot/components/SpotHeader";
import SpotPremiumBanner from "@/features/spot/components/SpotPremiumBanner";
import SpotSponsoredSlider from "@/features/spot/components/SpotSponsoredSlider";
import WidgetTabs from "@/components/widgets/WidgetTabs";
import CategoryChips from "@/features/spot/components/CategoryChips";
import { logSponsorViewEvent } from "@/utils/analytics";

const PAGE_PADDING = "px-4 md:px-10 lg:px-20";

const SpotsHome = () => {
  const [hoveredSpotId, setHoveredSpotId] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const [activeRegion, setActiveRegion] = useState("북부");
  const [selectedCity, setSelectedCity] = useState<string>("전체");
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation(null),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 }
    );
  }, []);

  const { contentMode, category } = useUiStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: rawSpots, isLoading } = useQuery<Spot[]>({
    queryKey: ["spots", contentMode, activeRegion, selectedCity, category],
    queryFn: () =>
      fetchSpots(contentMode, {
        region: activeRegion,
        city: selectedCity,
        category,
      }),
  });

  const spots = useMemo<Spot[]>(
    () =>
      (rawSpots || []).map((s: any) => ({
        ...s,
        id: s?.id || s?.firestoreId || s?._id || s?.slug || "",
      })),
    [rawSpots]
  );

  useEffect(() => {
    if (selectedCity !== "전체") setSearchParams({ region: activeRegion, city: selectedCity, category });
  }, [activeRegion, selectedCity, category, setSearchParams]);

  const filteredSpots = useMemo(() => {
    let list = spots || [];
    if (selectedCity !== "전체") list = list.filter((s) => s.city === selectedCity || s.region === selectedCity);
    if (category && category !== "전체") list = list.filter((s) => s.category === category);
    return list;
  }, [spots, selectedCity, category]);

  const handleSelectCity = (region: string, city: string) => {
    setActiveRegion(region);
    setSelectedCity(city);
  };

  useEffect(() => {
    (spots || [])
      .filter((s) => (s as any).isSponsored)
      .forEach((s: any) => logSponsorViewEvent(s.id, s.sponsorLevel));
  }, [spots]);

  const getRegionLabel = (region: string) => {
    switch (region) {
      case "북부":
        return "북부 (Northern Vietnam)";
      case "중부":
        return "중부 (Central Vietnam)";
      case "남부":
        return "남부 (Southern Vietnam)";
      default:
        return "전체";
    }
  };

  return (
    <>
      <main className={`relative overflow-visible mx-auto max-w-screen-2xl ${PAGE_PADDING} pb-32`}>
        <div className="flex flex-col items-center">
          <div className="w-full max-w-6xl">
            <SpotHeader regionLabel={getRegionLabel(activeRegion)} cityName={selectedCity} total={filteredSpots.length} mode={contentMode} category={category} />
            <CategoryChips />

            <div className="mt-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-text-secondary">도시 선택</span>
                <button
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-main"
                >
                  <FiFilter className="text-base" />
                  {selectedCity === "전체" ? "전체 보기" : selectedCity}
                </button>
              </div>
              <div className="text-xs text-text-secondary sm:text-sm">
                {selectedCity === "전체" ? "현재 전체 지역의 스팟을 보고 있습니다." : `${selectedCity} 지역의 스팟을 보고 있습니다.`}
              </div>
            </div>

            <section className="mt-8 space-y-6">
              <SpotPremiumBanner height={260} />
              <SpotSponsoredSlider />
            </section>

            <section className="mt-10">
              <h2 className="text-[28px] font-semibold text-text-main mb-4">추천 스팟</h2>
              <SpotList
                spots={filteredSpots}
                hoveredSpotId={hoveredSpotId}
                setHoveredSpotId={setHoveredSpotId}
                selectedSpotId={selectedSpotId}
                isLoading={isLoading}
              />
            </section>

            <section className="mt-10">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[22px] font-semibold text-text-main">지도 보기</h2>
              </div>
              <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow">
                <SpotMap spots={filteredSpots} hoveredSpotId={hoveredSpotId} onSpotSelect={(id) => setSelectedSpotId(id)} className="h-[420px] sm:h-[480px] md:h-[560px]" />
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* 위젯 토글 버튼 */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[10001] flex flex-col items-end gap-3">
        {!isWidgetOpen && (
          <button
            aria-label="유틸리티 열기"
            onClick={() => {
              setIsWidgetOpen(true);
              if (!userLocation) requestGeolocation();
            }}
            className="rounded-full shadow-lg border border-border bg-primary text-white px-5 py-3"
          >
            위젯
          </button>
        )}
      </div>

      {isWidgetOpen && <WidgetTabs spots={filteredSpots} mode={contentMode} onClose={() => setIsWidgetOpen(false)} />}

      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeRegion={activeRegion}
        selectedCity={selectedCity}
        onSelectCity={handleSelectCity}
      />
    </>
  );
};

export default SpotsHome;
