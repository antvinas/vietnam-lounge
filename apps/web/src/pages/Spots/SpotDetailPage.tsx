import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSpotById, fetchSponsoredSpots, fetchSpotReviews } from "@/api/spots.api";
import type { Spot, SpotReview } from "@/types/spot";
import useUiStore from "@/store/ui.store";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import SpotHero from "@/components/spots/SpotHero";
import SpotMainContent from "@/components/spots/SpotMainContent";
import SpotUtilitiesCard from "@/components/spots/SpotUtilitiesCard";
import AdSlot from "@/components/common/AdSlot";
import ReviewSection from "@/components/spots/ReviewSection";
import { logSponsorViewEvent } from "@/utils/analytics";
import SpotMap from "@/components/spots/SpotMap";
import SpotSeo from "@/components/seo/SpotSeo";
import SpotGallery from "@/components/spots/detail/SpotGallery";

const SpotDetailPage = () => {
  const { spotId } = useParams<{ spotId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { contentMode } = useUiStore(); // "explorer" | "nightlife"
  const [isFavorited, setIsFavorited] = useState(false);

  const {
    data: spot,
    isLoading: isLoadingSpot,
    isError: isErrorSpot,
  } = useQuery<Spot | null>({
    queryKey: ["spot", contentMode, spotId],
    queryFn: () => (spotId ? fetchSpotById(contentMode, spotId) : Promise.resolve(null)),
    enabled: !!spotId,
    onSuccess: (data) => { if (data && (data as any).isFavorited) setIsFavorited(true); },
  });

  const { data: recommendations = [] } = useQuery<Spot[]>({
    queryKey: ["recommendations", contentMode, spotId],
    queryFn: () => fetchSponsoredSpots(contentMode, 6),
    enabled: !!spotId,
  });

  const { data: reviews = [] } = useQuery<SpotReview[]>({
    queryKey: ["reviews", contentMode, spotId],
    queryFn: () => (spotId ? fetchSpotReviews(contentMode, spotId) : Promise.resolve([])),
    enabled: !!spotId,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => setIsFavorited((prev) => !prev),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["spot", contentMode, spotId] }),
  });

  useEffect(() => { window.scrollTo(0, 0); }, [spotId]);
  useEffect(() => { if (spot?.isSponsored) logSponsorViewEvent(spot.id, (spot as any).sponsorLevel); }, [spot]);

  const galleryImages = useMemo(
    () => [spot?.heroImage, ...(spot?.images || [])].filter(Boolean) as string[],
    [spot]
  );

  const coords = useMemo(() => {
    if (!spot) return undefined as undefined | { lat: number; lng: number };
    const c: any = spot;
    if (typeof c.latitude === "number" && typeof c.longitude === "number") return { lat: c.latitude, lng: c.longitude };
    if (c.coordinates && typeof c.coordinates.lat === "number" && typeof c.coordinates.lng === "number")
      return { lat: c.coordinates.lat, lng: c.coordinates.lng };
    if (c.location && typeof c.location.lat === "number" && typeof c.location.lng === "number")
      return { lat: c.location.lat, lng: c.location.lng };
    return undefined;
  }, [spot]);

  const avgRating = useMemo(() => {
    if (!reviews?.length) return typeof (spot as any)?.rating === "number" ? (spot as any).rating : undefined;
    const sum = reviews.reduce((s, r: any) => s + (r.rating || 0), 0);
    return sum / reviews.length;
  }, [reviews, spot]);

  if (isLoadingSpot)
    return <div className="flex h-screen items-center justify-center text-text-secondary">Loading Spot...</div>;

  if (isErrorSpot || !spot)
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <h2 className="text-[28px] font-bold text-text-main">Spot Not Found</h2>
        <p className="mt-2 text-[15px] text-text-secondary">찾으시는 스팟이 없거나 이동되었을 수 있습니다.</p>
        <button onClick={() => navigate(-1)} className="mt-8 rounded-xl bg-primary px-6 py-3 text-[15px] font-bold text-white shadow-lg hover:bg-primary-hover">
          뒤로가기
        </button>
      </div>
    );

  return (
    <PhotoProvider>
      <SpotSeo spot={spot} images={galleryImages} averageRating={avgRating} reviewCount={reviews?.length || undefined} />

      <div className="min-h-screen bg-background text-text-main transition-colors duration-300">
        <SpotHero
          spot={spot}
          isFavorited={isFavorited}
          onFavoriteToggle={() => toggleFavoriteMutation.mutate()}
          mode={contentMode}
          galleryImages={galleryImages}
        />

        <main className="relative z-10 -mt-16 mx-auto max-w-screen-xl px-4 py-8 md:px-10 lg:px-20 lg:py-12" role="main">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_340px] lg:gap-10">
            <div>
              {/* 갤러리 섹션(선택 위치) */}
              <SpotGallery
                cover={(spot as any)?.heroImage}
                images={(spot as any)?.images || []}
                spotName={(spot as any)?.name}
                className="mb-6"
              />
              <SpotMainContent spot={spot} reviews={reviews} />
            </div>

            <aside className="flex flex-col gap-6" aria-label="위치, 추천 스팟 및 여행 도구">
              {coords && (
                <section className="rounded-3xl border border-border bg-surface p-4 md:p-5 shadow-md" aria-label="위치">
                  <h3 className="mb-3 text-lg font-semibold text-text-main">위치</h3>
                  <div className="h-[260px] overflow-hidden rounded-2xl">
                    <SpotMap spot={{ ...spot, latitude: coords.lat, longitude: coords.lng } as any} height={260} readOnly />
                  </div>
                  {spot.address && <p className="mt-3 text-sm text-text-secondary">{spot.address}</p>}
                </section>
              )}

              <section className="rounded-3xl border border-border bg-surface p-4 md:p-5 shadow-md">
                <h3 className="mb-4 text-lg font-semibold text-text-main">추천 스팟</h3>
                <div className="grid grid-cols-1 gap-4">
                  {(recommendations.slice(0, 3) || []).length === 0 && (
                    <p className="text-sm text-text-secondary">추천 데이터가 아직 없습니다.</p>
                  )}
                  {recommendations.slice(0, 3).map((rec) => (
                    <div key={rec.id} className="overflow-hidden rounded-2xl border border-border bg-background-sub shadow-sm transition hover:shadow-md">
                      <PhotoView src={(rec as any).heroImage}>
                        <img
                          src={(rec as any).heroImage}
                          alt={`${rec.name} 대표 이미지`}
                          className="h-40 w-full object-cover"
                          loading="lazy"
                          decoding="async"
                          sizes="(min-width:1024px) 340px, 100vw"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }}
                        />
                      </PhotoView>
                      <div className="p-3">
                        <p className="font-semibold text-text-main">{rec.name}</p>
                        <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                          {rec.description || "소개 정보가 없습니다."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 여행 도구 → SpotUtilitiesCard로 교체 */}
              <SpotUtilitiesCard spots={recommendations.length ? recommendations : [spot]} mode={contentMode} />
            </aside>
          </div>

          <div className="mt-12" aria-label="스폰서 광고 배너">
            <AdSlot type="sponsorBottom" spot={spot} />
          </div>

          <section className="mt-16 max-w-4xl mx-auto">
            <ReviewSection spotId={spot.id} mode={contentMode} />
          </section>
        </main>
      </div>
    </PhotoProvider>
  );
};

export default SpotDetailPage;
