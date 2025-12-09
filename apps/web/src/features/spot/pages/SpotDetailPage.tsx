import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSpotById, fetchSponsoredSpots, fetchSpotReviews } from "@/api/spots.api";
import type { Spot, SpotReview } from "@/types/spot";
import useUiStore from "@/store/ui.store";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

// 아이콘
import { 
  FaMapMarkerAlt, FaClock, FaStar, FaUtensils, 
  FaConciergeBell, FaCamera, FaChevronLeft, FaPhoneAlt, FaShareAlt, FaHeart, FaRegHeart, FaRegEdit
} from "react-icons/fa";

import SpotUtilitiesCard from "@/features/spot/components/SpotUtilitiesCard";
import AdSlot from "@/components/common/AdSlot";
import SpotMap from "@/features/spot/components/SpotMap";
import SpotSeo from "@/components/seo/SpotSeo";
import { logSponsorViewEvent } from "@/utils/analytics";

const SpotDetailPage = () => {
  const { spotId } = useParams<{ spotId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { contentMode } = useUiStore(); 
  const [isFavorited, setIsFavorited] = useState(false);

  // 1. 데이터 페칭
  const { data: spot, isLoading, isError } = useQuery<Spot | null>({
    queryKey: ["spot", contentMode, spotId],
    queryFn: () => (spotId ? fetchSpotById(contentMode, spotId) : Promise.resolve(null)),
    enabled: !!spotId,
  });

  // 데이터 로드 시 좋아요 상태 동기화
  useEffect(() => {
    if (spot?.isFavorited) {
      setIsFavorited(true);
    }
  }, [spot?.isFavorited]);

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

  // 스크롤 초기화 및 스폰서 로그
  useEffect(() => { window.scrollTo(0, 0); }, [spotId]);
  
  useEffect(() => { 
    if (spot?.isSponsored && spot?.id) {
      logSponsorViewEvent(spot.id, spot.sponsorLevel); 
    }
  }, [spot?.id, spot?.isSponsored, spot?.sponsorLevel]);

  const galleryImages = useMemo(() => 
    [spot?.heroImage, ...(spot?.images || [])].filter(Boolean) as string[], 
  [spot]);

  const coords = useMemo(() => {
    if (!spot) return undefined;
    if (spot.coordinates) return spot.coordinates;
    if (typeof spot.latitude === "number" && typeof spot.longitude === "number") 
      return { lat: spot.latitude, lng: spot.longitude };
    return undefined;
  }, [spot]);

  if (isLoading) return <div className="flex h-screen items-center justify-center text-gray-400">Loading...</div>;
  if (isError || !spot) return <div className="flex h-screen items-center justify-center">Spot Not Found</div>;

  return (
    <PhotoProvider>
      <SpotSeo spot={spot} images={galleryImages} />

      <div className="min-h-screen bg-white font-sans text-gray-800">
        
        {/* ----------------------------------------------------------------
            1. Hero Section (헤더 - 다이닝코드 스타일)
           ---------------------------------------------------------------- */}
        <div className="relative h-[480px] w-full">
          <img 
            src={galleryImages[0] || "/placeholder.jpg"} 
            alt={spot.name} 
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          
          <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
            <Link to="/spots" className="flex items-center text-white/90 hover:text-white transition bg-black/30 px-4 py-2 rounded-full backdrop-blur-md hover:bg-black/50 border border-white/10">
              <FaChevronLeft className="mr-2 text-sm" /> <span className="text-sm font-medium">리스트로</span>
            </Link>
            <div className="flex gap-3">
              <button className="p-3 rounded-full bg-black/30 backdrop-blur-md text-white hover:bg-white/20 transition border border-white/10">
                <FaShareAlt />
              </button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 pb-16 z-20 text-white container mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {spot.isSponsored && (
                    <span className="px-3 py-1 rounded bg-yellow-500 text-black text-xs font-bold uppercase tracking-wider">
                      Premium Partner
                    </span>
                  )}
                  <span className="px-3 py-1 rounded bg-white/20 backdrop-blur text-xs font-medium border border-white/30">
                    {spot.category}
                  </span>
                  <span className="px-3 py-1 rounded bg-white/20 backdrop-blur text-xs font-medium border border-white/30">
                    {spot.city}
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight drop-shadow-lg">
                  {spot.name}
                </h1>
                
                <div className="flex items-center gap-6 text-lg font-medium text-gray-200">
                  <span className="flex items-center text-yellow-400">
                    <FaStar className="mr-2 text-xl" /> <span className="text-2xl font-bold text-white">{spot.rating}</span> 
                    <span className="text-white/60 ml-2 text-sm font-normal">({reviews.length}명 참여)</span>
                  </span>
                  <span className="h-4 w-[1px] bg-white/30"></span>
                  <span className="text-white/90">
                    {spot.priceRange || "가격정보 없음"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex-1 md:flex-none bg-white text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition shadow-lg flex items-center justify-center gap-2"
                >
                  <FaRegEdit /> 리뷰 쓰기
                </button>
                <button 
                  onClick={() => toggleFavoriteMutation.mutate()}
                  className="flex-1 md:flex-none bg-white/20 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/30 transition shadow-lg flex items-center justify-center gap-2"
                >
                  {isFavorited ? <FaHeart className="text-red-500" /> : <FaRegHeart />} 저장
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------
            2. Main Content (Sticky Sidebar Layout)
           ---------------------------------------------------------------- */}
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
            
            {/* [왼쪽] 상세 정보 (스크롤 영역) */}
            <div className="space-y-12">
              
              {/* 1. 갤러리 썸네일 */}
              <div className="grid grid-cols-4 gap-3 h-32 md:h-40">
                {galleryImages.slice(0, 4).map((img, idx) => (
                  <PhotoView key={idx} src={img}>
                    <div className="relative h-full w-full rounded-xl overflow-hidden cursor-pointer group shadow-sm border border-gray-100">
                      <img src={img} alt={`gallery-${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      {idx === 3 && galleryImages.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-lg backdrop-blur-[2px]">
                          +{galleryImages.length - 4} 더보기
                        </div>
                      )}
                    </div>
                  </PhotoView>
                ))}
              </div>

              {/* 2. 사장님 공지 & 배너 (★ 스폰서 핵심) */}
              {spot.isSponsored && (
                <div className="space-y-6">
                  {/* 공지사항 텍스트 */}
                  {spot.sponsorMessage && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 p-6 rounded-r-xl shadow-sm">
                      <h3 className="font-bold text-purple-900 mb-2 flex items-center text-lg">
                        <FaConciergeBell className="mr-2" /> 사장님 알림
                      </h3>
                      <p className="text-purple-800 leading-relaxed font-medium">{spot.sponsorMessage}</p>
                    </div>
                  )}

                  {/* ★ 배너 이미지 (주대표/시스템) */}
                  {spot.promotionalImages && spot.promotionalImages.length > 0 && (
                    <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                      {spot.promotionalImages.map((img, idx) => (
                        <PhotoView key={idx} src={img}>
                          <img 
                            src={img} 
                            alt="가격표 및 시스템 안내" 
                            className="w-full h-auto object-cover block border-b last:border-0 border-gray-100 hover:opacity-95 transition cursor-zoom-in"
                          />
                        </PhotoView>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <hr className="border-gray-100" />

              {/* 3. 메뉴 정보 (일반 텍스트 메뉴) */}
              <section>
                <div className="flex justify-between items-end mb-6">
                  <h3 className="text-2xl font-extrabold text-gray-900">메뉴</h3>
                </div>
                
                {spot.menus && spot.menus.length > 0 ? (
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {spot.menus.map((menu, idx) => (
                      <li key={idx} className="flex justify-between items-start border-b border-gray-100 pb-2">
                        <div className="pr-4">
                          <span className="font-bold text-gray-800 block text-lg">{menu.name}</span>
                          {menu.description && <span className="text-sm text-gray-500 mt-1 block">{menu.description}</span>}
                        </div>
                        <span className="font-bold text-gray-900 whitespace-nowrap">{menu.price}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">등록된 메뉴 정보가 없습니다.</p>
                )}
              </section>

              <hr className="border-gray-100" />

              {/* 4. 소개 */}
              <section>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-6">소개</h3>
                <p className="text-gray-600 leading-8 whitespace-pre-line text-lg">
                  {spot.description}
                </p>
                
                <div className="mt-8 flex flex-wrap gap-2">
                  {spot.tags?.map(tag => (
                    <span key={tag} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition cursor-pointer">
                      #{tag}
                    </span>
                  ))}
                </div>
              </section>

              <hr className="border-gray-100" />

              {/* 5. 리뷰 섹션 */}
              <section id="review-section">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-extrabold text-gray-900">
                    리뷰 <span className="text-gray-400 font-normal ml-1">{reviews.length}개</span>
                  </h3>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">나</div>
                    <p className="font-bold text-gray-700">이 장소, 어떠셨나요?</p>
                  </div>
                  <textarea 
                    className="w-full bg-white border border-gray-300 rounded-xl p-4 min-h-[120px] text-base focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition placeholder-gray-400 resize-none"
                    placeholder="솔직한 후기를 남겨주세요. 다른 여행자들에게 큰 도움이 됩니다!"
                  />
                  <div className="flex justify-between items-center mt-4">
                    <div className="flex text-3xl text-gray-300 hover:text-yellow-400 cursor-pointer transition gap-1">
                      <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                    </div>
                    <button className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition shadow-lg">
                      등록하기
                    </button>
                  </div>
                </div>

                <div className="space-y-8">
                  {reviews.length > 0 ? reviews.map((review) => (
                    <div key={review.id} className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="font-bold text-gray-900 text-lg">{review.displayName || "익명 사용자"}</span>
                          <span className="text-sm text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex text-yellow-400 text-sm mb-3">
                          {[...Array(review.rating)].map((_, i) => <FaStar key={i} />)}
                        </div>
                        <p className="text-gray-700 leading-relaxed text-base">{review.content}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400">아직 등록된 리뷰가 없습니다.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* [오른쪽] Sticky Sidebar (지도 & 기본정보 - 핵심!) */}
            <aside className="relative h-full">
              <div className="sticky top-24 space-y-6">
                
                {/* 1. 지도 & 정보 통합 카드 */}
                <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
                  
                  {/* 지도 영역 (상단) */}
                  <div className="relative h-56 bg-gray-100">
                    {coords ? (
                      <SpotMap spot={spot} height="100%" readOnly />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">지도 정보 없음</div>
                    )}
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.name + " " + spot.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-blue-600 px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-white transition flex items-center z-[1000]"
                    >
                      <FaMapMarkerAlt className="mr-2" /> 길찾기
                    </a>
                  </div>

                  {/* 정보 영역 (하단) */}
                  <div className="p-6 space-y-5">
                    <div className="flex items-start gap-4">
                      <FaMapMarkerAlt className="mt-1 text-gray-400 text-lg shrink-0" />
                      <p className="text-gray-700 font-medium leading-snug">{spot.address}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <FaClock className="text-gray-400 text-lg shrink-0" />
                      <div>
                        <p className="text-green-600 font-bold text-sm mb-0.5">영업 중</p>
                        <p className="text-gray-500 text-sm">{spot.openHours}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <FaPhoneAlt className="text-gray-400 text-lg shrink-0" />
                      <p className="text-gray-700 font-medium">{spot.phone || "전화번호 정보 없음"}</p>
                    </div>

                    <hr className="border-gray-100 my-4" />

                    {/* 편의시설 */}
                    <div>
                      <h5 className="font-bold text-gray-900 mb-3 text-sm">편의 시설</h5>
                      <div className="flex flex-wrap gap-2">
                        {spot.services?.map(srv => (
                          <span key={srv} className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium border border-gray-100">
                            {srv}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. 광고 배너 */}
                <AdSlot type="sidebar" spot={spot} />

                {/* 3. 추천 스팟 */}
                <SpotUtilitiesCard spots={recommendations} mode={contentMode} />
              </div>
            </aside>

          </div>
        </div>
      </div>
    </PhotoProvider>
  );
};

export default SpotDetailPage;