import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSpotById,
  getRecommendations,
  toggleFavoriteStatus,
  fetchReviewsBySpotId,
} from "@/api/spots.api";
import type { Spot, Review } from "@/types/spot";
import useUiStore from "@/store/ui.store";
import { PhotoProvider } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

import SpotHero from "@/components/spots/SpotHero";
import SpotMainContent from "@/components/spots/SpotMainContent";
import SpotSidebar from "@/components/spots/SpotSidebar";
import SpotSidebarWidgets from "@/components/spots/SpotSidebarWidgets";

const SpotDetailPage = () => {
  const { spotId } = useParams<{ spotId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { contentMode } = useUiStore();
  const mode = contentMode === "nightlife" ? "nightlife" : "explorer";

  const [isFavorited, setIsFavorited] = useState(false);

  // 🟢 Spot 상세
  const {
    data: spot,
    isLoading: isLoadingSpot,
    isError: isErrorSpot,
  } = useQuery<Spot | null>({
    queryKey: ["spot", spotId],
    queryFn: () => (spotId ? getSpotById(spotId) : Promise.resolve(null)),
    enabled: !!spotId,
    onSuccess: (data) => {
      if (data) setIsFavorited(data.isFavorited || false);
    },
  });

  // 🟢 추천 Spot
  const { data: recommendations } = useQuery<Spot[]>({
    queryKey: ["recommendations", spotId],
    queryFn: () => (spotId ? getRecommendations(spotId) : Promise.resolve([])),
    enabled: !!spotId,
  });

  // 🟢 리뷰 목록
  const { data: reviews } = useQuery<Review[]>({
    queryKey: ["reviews", spotId],
    queryFn: () => (spotId ? fetchReviewsBySpotId(spotId) : Promise.resolve([])),
    enabled: !!spotId,
  });

  // 🟢 즐겨찾기 토글
  const toggleFavoriteMutation = useMutation({
    mutationFn: (spotId: string) => toggleFavoriteStatus({ spotId }),
    onSuccess: (data: { isFavorite: boolean }) => {
      setIsFavorited(data.isFavorite);
      queryClient.invalidateQueries({ queryKey: ["spot", spotId] });
    },
  });

  const handleFavoriteToggle = () => {
    if (spotId) toggleFavoriteMutation.mutate(spotId);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [spotId]);

  if (isLoadingSpot) {
    return (
      <div className="flex h-screen items-center justify-center text-text-secondary">
        Loading Spot...
      </div>
    );
  }

  if (isErrorSpot || !spot) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <h2 className="text-[28px] font-bold text-text-main">Spot Not Found</h2>
        <p className="mt-2 text-[15px] text-text-secondary">
          찾으시는 스팟이 없거나 이동되었을 수 있습니다.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-8 rounded-xl bg-primary px-6 py-3 text-[15px] font-bold text-white shadow-lg hover:bg-primary-hover"
        >
          뒤로가기
        </button>
      </div>
    );
  }

  const galleryImages = [spot.heroImage, ...(spot.imageUrls || [])].filter(
    Boolean
  ) as string[];

  return (
    <PhotoProvider>
      <div className={`min-h-screen bg-background text-text-main ${mode}`}>
        <SpotHero
          spot={spot}
          isFavorited={isFavorited}
          onFavoriteToggle={handleFavoriteToggle}
          mode={mode}
          galleryImages={galleryImages}
        />

        <main className="relative z-10 -mt-16 mx-auto max-w-screen-xl px-4 py-8 md:px-10 lg:px-20 lg:py-12">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_320px] lg:gap-8">
            <SpotMainContent spot={spot} reviews={reviews} mode={mode} />

            {/* ✅ 수정: SpotSidebar 자체가 반응형 Drawer를 포함하므로 aside 불필요 */}
            <div className="flex flex-col gap-6">
              <SpotSidebar
                spot={spot}
                recommendations={recommendations}
                mode={mode}
              />
              <SpotSidebarWidgets spot={spot} />
            </div>
          </div>
        </main>
      </div>
    </PhotoProvider>
  );
};

export default SpotDetailPage;
