// apps/web/src/features/spot/pages/SpotDetailPage.tsx
import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as SpotApi from "@/api/spot";
import type { Spot, SpotReview } from "@/types/spot";
import useUiStore from "@/store/ui.store";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import toast from "react-hot-toast";

// 아이콘
import {
  FaMapMarkerAlt,
  FaClock,
  FaStar,
  FaConciergeBell,
  FaCamera,
  FaChevronLeft,
  FaPhoneAlt,
  FaRegEdit,
  FaExclamationTriangle,
  FaTaxi,
  FaMapMarkedAlt,
  FaCalendarPlus,
  FaMoneyBillWave,
} from "react-icons/fa";

import SpotUtilitiesCard from "@/features/spot/components/SpotUtilitiesCard";
import AdSlot from "@/components/common/AdSlot";
import SpotMap from "@/features/spot/components/SpotMap";
import SpotSeo from "@/components/seo/SpotSeo";
import SpotActionBar from "@/features/spot/components/detail/SpotActionBar";
import { logSponsorViewEvent } from "@/utils/analytics";
import Loading from "@/components/common/Loading";
import { getSpotPriceDisplay } from "@/constants/filters";

type SpotMode = "explorer" | "nightlife";

function normalizeMode(contentMode: unknown): SpotMode {
  return contentMode === "nightlife" ? "nightlife" : "explorer";
}

async function apiGetSpotById(id: string, mode: SpotMode): Promise<Spot> {
  const mod: any = SpotApi as any;
  const fn =
    mod.getSpotById ||
    mod.fetchSpotById ||
    mod.fetchSpot ||
    mod.getSpot ||
    (() => {
      throw new Error("Spot API: getSpotById/fetchSpotById not found");
    });

  // 다양한 시그니처 대응
  try {
    return await fn(id, mode);
  } catch {
    return await fn(id);
  }
}

async function apiGetSponsoredSpots(mode: SpotMode): Promise<Spot[]> {
  const mod: any = SpotApi as any;
  const fn = mod.getSponsoredSpots || mod.fetchSponsoredSpots || mod.fetchSponsorSpots || (() => []);

  // (mode, take) / ({mode, take}) / ("slider", mode) 등 혼재 대응
  try {
    const res = await fn(mode, 10);
    return Array.isArray(res) ? res : [];
  } catch {
    try {
      const res = await fn({ mode, take: 10 });
      return Array.isArray(res) ? res : [];
    } catch {
      try {
        const res = await fn("slider", mode);
        return Array.isArray(res) ? res : [];
      } catch {
        return [];
      }
    }
  }
}

async function apiGetSpotReviews(spotId: string, mode: SpotMode): Promise<SpotReview[]> {
  const mod: any = SpotApi as any;
  const fn = mod.getSpotReviews || mod.fetchSpotReviews || mod.fetchReviews || (() => []);

  // (spotId, mode) / (mode, spotId) / (spotId) 혼재 대응
  try {
    const res = await fn(spotId, mode);
    return Array.isArray(res) ? res : [];
  } catch {
    try {
      const res = await fn(mode, spotId);
      return Array.isArray(res) ? res : [];
    } catch {
      const res = await fn(spotId);
      return Array.isArray(res) ? res : [];
    }
  }
}

const SpotDetailPage = () => {
  const { spotId } = useParams<{ spotId: string }>();
  const navigate = useNavigate();
  const { contentMode } = useUiStore();

  const mode = normalizeMode(contentMode);

  // 1) 스팟 데이터
  const { data: spot, isLoading, isError } = useQuery<Spot>({
    queryKey: ["spot", spotId, mode],
    queryFn: () => apiGetSpotById(spotId!, mode),
    enabled: !!spotId,
  });

  // 2) 추천(스폰서) 스팟
  const { data: recommendations = [] } = useQuery<Spot[]>({
    queryKey: ["sponsored-spots", mode],
    queryFn: () => apiGetSponsoredSpots(mode),
  });

  // 3) 리뷰 데이터
  const { data: reviews = [] } = useQuery<SpotReview[]>({
    queryKey: ["reviews", spotId, mode],
    queryFn: () => apiGetSpotReviews(spotId!, mode),
    enabled: !!spotId,
  });

  useEffect(() => {
    if (spot && (spot as any).isSponsored) {
      // 기존 구현은 2개 인자였지만 현재 타입은 0~1개로 제한된 상태라 1개만 전달
      (logSponsorViewEvent as any)(spot.id);
    }
  }, [spot]);

  const images = useMemo(() => {
    const s: any = spot as any;
    const list: string[] =
      (Array.isArray(s?.images) && s.images) ||
      (Array.isArray(s?.imageUrls) && s.imageUrls) ||
      (typeof s?.heroImage === "string" && s.heroImage ? [s.heroImage] : []) ||
      (typeof s?.imageUrl === "string" && s.imageUrl ? [s.imageUrl] : []);

    if (!list.length) return ["/placeholders/spot.jpg"];
    return list;
  }, [spot]);

  const isOpenNow = useMemo(() => {
    return !!(spot as any)?.openHours;
  }, [spot]);

  const lat = useMemo(() => {
    const s: any = spot as any;
    return s?.latitude ?? s?.location?.lat ?? s?.location?.latitude ?? s?.geo?.lat ?? null;
  }, [spot]);

  const lng = useMemo(() => {
    const s: any = spot as any;
    return s?.longitude ?? s?.location?.lng ?? s?.location?.longitude ?? s?.geo?.lng ?? null;
  }, [spot]);

  // ✅ 단일 소스: 예산 우선 → priceLevel fallback
  const priceDisplay = useMemo(() => getSpotPriceDisplay(spot as any), [spot]);

  const handleGrab = () => {
    if (!lat || !lng) {
      toast.error("위치 정보가 없어 Grab을 호출할 수 없습니다.");
      return;
    }
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = `grab://open?screenType=BOOKING&drop_lat=${lat}&drop_long=${lng}`;
    } else {
      const s: any = spot as any;
      navigator.clipboard.writeText(s?.address || s?.location?.address || s?.name || "");
      toast.success("주소가 복사되었습니다! Grab 앱에 붙여넣으세요.");
    }
  };

  const handleRoute = () => {
    if (!lat || !lng) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
  };

  const handleAddToPlan = () => {
    toast.success("일정에 추가되었습니다! (기능 준비 중)", {
      icon: "🗓️",
      style: { borderRadius: "10px", background: "#333", color: "#fff" },
    });
  };

  const handleReport = () => {
    const subject = `[정보수정요청] ${(spot as any)?.name} (${(spot as any)?.id})`;
    const body = "수정할 내용을 입력해주세요 (예: 폐업함, 가격 변동 등).";
    window.open(`mailto:support@vnlounge.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading />
      </div>
    );

  if (isError || !spot)
    return <div className="flex h-[50vh] items-center justify-center text-gray-500">정보를 불러올 수 없습니다.</div>;

  const services = ((spot as any).services as string[] | undefined) ?? [];

  return (
    <PhotoProvider>
      <SpotSeo spot={spot} />

      <div className="min-h-screen bg-white pb-20 font-sans">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 md:px-10 py-3 flex items-center justify-between shadow-sm transition-all">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-gray-600 hover:text-primary transition-colors text-sm font-medium"
          >
            <FaChevronLeft /> 목록으로
          </button>

          <h2 className="text-sm font-bold text-gray-800 truncate max-w-[150px] opacity-0 md:opacity-100 transition-opacity">
            {(spot as any).name}
          </h2>

          <SpotActionBar spot={spot} className="flex gap-2" />
        </div>

        <div className="max-w-7xl mx-auto mt-6 px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* 왼쪽: 메인 콘텐츠 */}
            <div className="lg:col-span-8 space-y-10">
              {/* 1. 이미지 갤러리 */}
              <div className="grid grid-cols-4 gap-2 rounded-2xl overflow-hidden aspect-[16/9] shadow-inner bg-gray-100 relative">
                <div className="col-span-4 md:col-span-3 relative group cursor-pointer h-full">
                  <PhotoView src={images[0]}>
                    <img
                      src={images[0]}
                      alt="main"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </PhotoView>
                  <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5 pointer-events-none">
                    <FaCamera /> <span>사진 전체보기</span>
                  </div>
                </div>
                <div className="hidden md:flex flex-col gap-2 h-full">
                  {images.slice(1, 4).map((img: string, idx: number) => (
                    <PhotoView key={idx} src={img}>
                      <div className="relative flex-1 cursor-pointer overflow-hidden group">
                        <img
                          src={img}
                          alt={`sub-${idx}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    </PhotoView>
                  ))}
                </div>
              </div>

              {/* 2. 스팟 기본 정보 */}
              <div className="border-b border-gray-100 pb-8">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                    {(spot as any).category}
                  </span>

                  {priceDisplay.primary ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 text-gray-700 text-xs font-bold rounded-full border border-gray-100">
                      <FaMoneyBillWave className="text-gray-500" />
                      {priceDisplay.primary}
                    </span>
                  ) : null}

                  {isOpenNow && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full border border-green-100">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      영업 중
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-4 tracking-tight">
                  {(spot as any).name}
                </h1>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <FaStar className="text-yellow-400" size={16} />
                    <span className="font-bold text-gray-900 text-lg">
                      {typeof (spot as any).rating === "number" ? (spot as any).rating.toFixed(1) : "0.0"}
                    </span>
                    <span className="text-gray-400 underline cursor-pointer hover:text-gray-800">리뷰 {reviews.length}개</span>
                  </div>

                  <div
                    className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer group"
                    onClick={handleRoute}
                  >
                    <FaMapMarkerAlt className="text-gray-400 group-hover:text-primary" />
                    <span>{(spot as any).address || (spot as any).location?.address || "주소 정보 없음"}</span>
                  </div>
                </div>

                {priceDisplay.secondary ? (
                  <div className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                    <span className="font-bold text-gray-700">참고</span> · {priceDisplay.secondary}
                  </div>
                ) : null}
              </div>

              {/* 3. Mobile Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:hidden">
                <button
                  onClick={handleAddToPlan}
                  className="col-span-2 flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl font-bold shadow-md active:scale-95 transition-transform"
                >
                  <FaCalendarPlus /> 일정에 추가
                </button>
                <button
                  onClick={handleGrab}
                  className="flex flex-col items-center justify-center py-3 bg-green-50 text-green-700 rounded-xl font-medium border border-green-100 active:bg-green-100 transition-colors"
                >
                  <FaTaxi className="text-xl mb-1" /> Grab
                </button>
                <button
                  onClick={handleRoute}
                  className="flex flex-col items-center justify-center py-3 bg-blue-50 text-blue-700 rounded-xl font-medium border border-blue-100 active:bg-blue-100 transition-colors"
                >
                  <FaMapMarkedAlt className="text-xl mb-1" /> 길찾기
                </button>
              </div>

              {/* 4. 상세 설명 */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">소개</h3>
                <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                  {(spot as any).description || "등록된 소개글이 없습니다."}
                </div>
              </div>

              {/* 5. 편의 시설 */}
              {services.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">편의 시설 & 서비스</h3>
                  <div className="flex flex-wrap gap-3">
                    {services.map((srv: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-white text-gray-700 rounded-xl text-sm font-medium border border-gray-200 shadow-sm flex items-center gap-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-primary/60"></span>
                        {srv}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. 지도 */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-primary" /> 위치
                </h3>
                <div className="h-[400px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
                  {lat && lng ? (
                    <SpotMap spot={spot} className="h-full w-full" key={(spot as any).id} />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gray-50 text-gray-400">지도 정보 없음</div>
                  )}
                </div>
              </div>

              {/* 7. 리뷰 */}
              <div className="border-t border-gray-200 pt-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FaRegEdit className="text-primary" /> 방문자 리뷰 <span className="text-primary">({reviews.length})</span>
                  </h3>
                  <button className="px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition shadow-lg shadow-gray-200/50">
                    리뷰 작성
                  </button>
                </div>

                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review: any) => (
                      <div key={review.id} className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between mb-2">
                          <span className="font-bold text-gray-900">{review.userName || review.displayName}</span>
                          <span className="text-xs text-gray-400">
                            {review.createdAt
                              ? new Date(
                                  review.createdAt?.seconds ? review.createdAt.seconds * 1000 : review.createdAt
                                ).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                        <p className="text-gray-600">{review.content || review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <p className="text-gray-400">첫 번째 리뷰의 주인공이 되어보세요!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 오른쪽: 사이드바 */}
            <aside className="hidden lg:block lg:col-span-4 space-y-6">
              <div className="sticky top-24 space-y-6">
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-blue-400"></div>

                  <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FaConciergeBell className="text-primary" /> 상세 정보
                  </h4>

                  <div className="space-y-6 mb-8">
                    {/* ✅ 예산/가격대 */}
                    {priceDisplay.primary ? (
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 shrink-0">
                          <FaMoneyBillWave />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">BUDGET</p>
                          <p className="text-gray-700 font-semibold text-sm">{priceDisplay.primary}</p>
                          {priceDisplay.secondary ? (
                            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{priceDisplay.secondary}</p>
                          ) : null}
                        </div>
                      </div>
                    ) : null}

                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                        <FaClock />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">OPEN HOURS</p>
                        <p className="text-gray-700 font-medium text-sm">{(spot as any).openHours || "시간 정보 없음"}</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <FaPhoneAlt />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">PHONE</p>
                        <p className="text-gray-700 font-medium text-sm">{(spot as any).phone || "정보 없음"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleAddToPlan}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-all active:scale-95"
                    >
                      <FaCalendarPlus /> 일정에 추가
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleGrab}
                        className="flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 font-bold rounded-xl border border-green-100 hover:bg-green-100 transition-colors"
                      >
                        <FaTaxi /> Grab 호출
                      </button>
                      <button
                        onClick={handleRoute}
                        className="flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
                      >
                        <FaMapMarkedAlt /> 길찾기
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleReport}
                  className="w-full py-3 text-xs text-gray-400 hover:text-gray-600 underline flex items-center justify-center gap-1 transition-colors"
                >
                  <FaExclamationTriangle /> 정보가 잘못되었나요? 수정 제안하기
                </button>

                <AdSlot type="sidebar" spot={spot} />
                <SpotUtilitiesCard spots={recommendations} mode={mode} />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </PhotoProvider>
  );
};

export default SpotDetailPage;
