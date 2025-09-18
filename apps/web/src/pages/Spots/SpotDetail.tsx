import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  getSpotById,
  fetchReviewsBySpotId,
  addReview,
  toggleFavoriteStatus,
  getRecommendations,
} from '../../api/spots.api';
import type { Spot, Review } from '@/types/spot';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import {
  FaArrowLeft,
  FaBolt,
  FaBookmark,
  FaCloudRain,
  FaHeart,
  FaLocationArrow,
  FaMapMarkerAlt,
  FaRegClock,
  FaRegHeart,
  FaRegStar,
  FaShareAlt,
  FaStar,
  FaTag,
  FaTicketAlt,
  FaTrain,
  FaWifi,
} from 'react-icons/fa';
import { useAuthStore } from '../../store/auth.store';
import useUiStore from '@/store/ui.store';

const containerStyle = {
  width: '100%',
  height: '320px',
};

const reviewKeywordChips = ['맛', '서비스', '청결', '분위기', '가격'];

const modeTokens = {
  explorer: {
    page: 'bg-explorer-bg text-text-main',
    heroOverlay: 'from-black/85 via-[#0B1726]/50 to-transparent',
    surface: 'bg-surface text-text-main',
    surfaceMuted: 'bg-surface/90 text-text-main',
    badge: 'bg-explorer-primary text-white',
    primaryButton: 'bg-explorer-primary hover:bg-explorer-primary/90 text-white shadow-[0_12px_30px_rgba(43,182,197,0.35)]',
    secondaryButton: 'border-explorer-primary/40 text-explorer-primary hover:bg-explorer-primary/10',
    outlineButton: 'border border-white/30 text-text-main hover:bg-white/10',
    chip: 'bg-explorer-primary/15 text-explorer-primary',
    outlineChip: 'border border-white/30 text-text-secondary hover:border-explorer-primary/60 hover:text-explorer-primary',
    glow: 'shadow-[0_25px_60px_rgba(43,182,197,0.22)]',
  },
  nightlife: {
    page: 'bg-nightlife-bg text-nightlife-text',
    heroOverlay: 'from-black/90 via-[#0E1526]/60 to-transparent',
    surface: 'bg-nightlife-surface/90 text-nightlife-text',
    surfaceMuted: 'bg-nightlife-surface/80 text-nightlife-text',
    badge: 'bg-nightlife-primary text-white',
    primaryButton: 'bg-nightlife-primary hover:bg-nightlife-primary/90 text-white shadow-[0_0_35px_rgba(139,92,246,0.55)]',
    secondaryButton: 'border-nightlife-primary/50 text-nightlife-primary hover:bg-nightlife-primary/10',
    outlineButton: 'border border-white/20 text-nightlife-text hover:bg-white/10',
    chip: 'bg-nightlife-primary/15 text-nightlife-primary',
    outlineChip: 'border border-white/30 text-nightlife-text-secondary hover:border-nightlife-primary/60 hover:text-nightlife-primary',
    glow: 'shadow-[0_25px_60px_rgba(139,92,246,0.28)]',
  },
};

type ModeKey = keyof typeof modeTokens;

const ReviewStarRow = ({ value }: { value: number }) => (
  <div className="flex items-center gap-1 text-yellow-400">
    {Array.from({ length: 5 }).map((_, index) =>
      index < Math.round(value) ? <FaStar key={index} /> : <FaRegStar key={index} className="text-yellow-200/40" />
    )}
  </div>
);

const WidgetCard = ({ title, children, mode }: { title: string; children: React.ReactNode; mode: ModeKey }) => (
  <div className={`rounded-2xl border border-white/10 p-5 ${modeTokens[mode].surfaceMuted}`}>
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-secondary">{title}</p>
    <div className="mt-3 space-y-3 text-sm leading-relaxed">{children}</div>
  </div>
);

const SpotDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { contentMode } = useUiStore();
  const mode = (contentMode ?? 'explorer') as ModeKey;
  const tokens = modeTokens[mode];

  const [isFavorited, setIsFavorited] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [reviewSort, setReviewSort] = useState<'latest' | 'rating'>('latest');
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [keywordFilter, setKeywordFilter] = useState('');

  const handleShare = () => {
    if (typeof window === 'undefined') return;

    if (navigator.share) {
      navigator
        .share({
          title: spot?.name ?? 'Vietnam Lounge Spot',
          text: spot?.description,
          url: window.location.href,
        })
        .catch(() => undefined);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => undefined);
    }
  };

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const { data: spot, isLoading, isError } = useQuery<Spot | null>(
    ['spot', id],
    () => (id ? getSpotById(id) : Promise.resolve(null)),
    {
      onSuccess: (data) => {
        if (data) {
          setIsFavorited(data.isFavorited || false);
        }
      },
    }
  );

  const { data: reviews, isLoading: isLoadingReviews } = useQuery<Review[]>(
    ['reviews', id],
    () => (id ? fetchReviewsBySpotId(id) : Promise.resolve([])),
    { enabled: Boolean(id) }
  );

  const { data: recommendations, isLoading: isLoadingRecommendations } = useQuery<Spot[]>(
    ['recommendations', id],
    () => (id ? getRecommendations(id) : Promise.resolve([])),
    { enabled: Boolean(id) }
  );

  const toggleFavoriteMutation = useMutation(
    (spotId: string) => toggleFavoriteStatus(spotId, !isFavorited),
    {
      onSuccess: (updatedSpot) => {
        setIsFavorited(updatedSpot.isFavorited || false);
        queryClient.setQueryData(['spot', id], updatedSpot);
      },
    }
  );

  const addReviewMutation = useMutation(
    ({ spotId, rating, comment, author }: { spotId: string; rating: number; comment: string; author: string }) =>
      addReview(spotId, rating, comment, author),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reviews', id]);
        setNewReview({ rating: 0, comment: '' });
      },
    }
  );

  const handleFavoriteClick = () => {
    if (id) {
      toggleFavoriteMutation.mutate(id);
    }
  };

  const handleReviewSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (id && newReview.comment && newReview.rating > 0 && user) {
      addReviewMutation.mutate({ spotId: id, ...newReview, author: user.username });
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const filteredReviews = useMemo(() => {
    if (!reviews) return [];

    let computed = [...reviews];

    if (reviewSort === 'latest') {
      computed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (reviewSort === 'rating') {
      computed.sort((a, b) => b.rating - a.rating);
    }

    if (starFilter) {
      computed = computed.filter((review) => Math.round(review.rating) === starFilter);
    }

    if (keywordFilter) {
      const keyword = keywordFilter.toLowerCase();
      computed = computed.filter((review) => review.comment.toLowerCase().includes(keyword));
    }

    return computed;
  }, [reviews, reviewSort, starFilter, keywordFilter]);

  if (isLoading) {
    return <div className="flex h-[70vh] items-center justify-center text-text-secondary">로딩 중...</div>;
  }

  if (isError || !spot) {
    return <div className="py-20 text-center text-red-500">해당 스팟을 찾을 수 없습니다.</div>;
  }

  const mapCenter = { lat: spot.latitude, lng: spot.longitude };
  const reviewCount = spot.reviewCount ?? reviews?.length ?? 0;
  const primaryCtaLabel = spot.hasCoupon ? spot.coupon?.ctaLabel ?? '쿠폰 받기' : '예약하기';
  const hasMapLink = Boolean(spot.mapUrl);
  const secondaryCtaLabel = hasMapLink ? '길찾기' : '공유하기';

  return (
    <div className={`min-h-screen ${tokens.page}`}>
      <div className="relative h-[420px] w-full overflow-hidden">
        <img
          src={spot.heroImage || spot.imageUrls?.[0] || spot.imageUrl}
          alt={spot.name}
          className="h-full w-full object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${tokens.heroOverlay}`} />
        <div className="absolute left-1/2 top-0 h-full w-full max-w-7xl -translate-x-1/2 px-6 md:px-12 lg:px-20">
          <div className="flex h-full items-end pb-16">
            <div className="max-w-3xl">
              <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-semibold ${tokens.badge}`}>
                {spot.category}
              </span>
              <h1 className="mt-6 text-[clamp(2.5rem,5vw,3.5rem)] font-extrabold leading-tight text-white">{spot.name}</h1>
              <p className="mt-3 flex items-center gap-2 text-lg text-white/80">
                <FaMapMarkerAlt /> {spot.address}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="absolute left-6 top-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
        >
          <FaArrowLeft />
        </button>
        {user && (
          <button
            onClick={handleFavoriteClick}
            className="absolute right-6 top-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur"
          >
            {isFavorited ? <FaHeart className="text-red-400" /> : <FaRegHeart />}
          </button>
        )}
      </div>

      <div className="relative z-10 -mt-20">
        <div className="mx-auto max-w-7xl px-4 pb-24 md:px-12 lg:px-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-12">
              <section className={`rounded-3xl border border-white/10 p-8 shadow-subtle ${tokens.surface}`}>
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="max-w-2xl space-y-4">
                    <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.4em] text-text-secondary">
                      <FaStar className="text-yellow-400" /> {reviewCount} Reviews
                    </div>
                    <p className="text-lg leading-relaxed text-text-secondary">{spot.description}</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-text-secondary">평점</p>
                        <div className="mt-2 flex items-end gap-3">
                          <span className="text-3xl font-extrabold">{spot.rating.toFixed(1)}</span>
                          <ReviewStarRow value={spot.rating} />
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/10 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-text-secondary">영업시간</p>
                        <p className="mt-2 text-sm font-medium">{spot.operatingHours || '정보 준비 중'}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-text-secondary">지역</p>
                        <p className="mt-2 text-sm font-medium">
                          {spot.region} · {spot.city}
                          {spot.district ? ` · ${spot.district}` : ''}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-text-secondary">가격대</p>
                        <p className="mt-2 text-sm font-medium">{spot.priceRange ?? '문의'}</p>
                      </div>
                    </div>
                  </div>
                  <div className={`w-full max-w-xs rounded-3xl border border-white/10 p-6 ${tokens.surfaceMuted}`}>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.4em] text-text-secondary">문맥형 CTA</h3>
                    <p className="mt-3 text-xl font-bold">{primaryCtaLabel}</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {spot.hasCoupon ? spot.coupon?.description ?? '현장 결제 시 혜택 적용' : '바로 예약하고 실시간 확정 받기'}
                    </p>
                    <div className="mt-6 space-y-3">
                      <a
                        href={spot.hasCoupon ? spot.couponUrl ?? '#' : spot.bookingUrl ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex h-12 items-center justify-center rounded-xl font-semibold ${tokens.primaryButton}`}
                      >
                        {primaryCtaLabel}
                      </a>
                      {hasMapLink ? (
                        <a
                          href={spot.mapUrl ?? '#'}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${tokens.outlineButton}`}
                        >
                          <FaLocationArrow className="text-sm" />
                          {secondaryCtaLabel}
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={handleShare}
                          className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${tokens.outlineButton}`}
                        >
                          <FaShareAlt className="text-sm" /> 링크 공유하기
                        </button>
                      )}
                      <button
                        type="button"
                        className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${tokens.secondaryButton}`}
                      >
                        <FaBookmark /> 북마크
                      </button>
                    </div>
                  </div>
                </div>

                {spot.tags && spot.tags.length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-3">
                    {spot.tags.slice(0, 6).map((tag) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest ${tokens.chip}`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </section>

              {spot.coupon && (
                <section className={`rounded-3xl border border-white/10 p-8 shadow-subtle ${tokens.surface}`}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-semibold ${tokens.badge}`}>
                        <FaTicketAlt /> 쿠폰 혜택
                      </span>
                      <h2 className="mt-4 text-2xl font-semibold">{spot.coupon.title}</h2>
                      <p className="mt-2 text-sm text-text-secondary">{spot.coupon.description}</p>
                    </div>
                    <div className="rounded-2xl border border-dashed border-white/20 p-4 text-sm">
                      <p className="font-semibold">유효기간</p>
                      <p className="text-text-secondary">{spot.coupon.expiresAt ?? '상시 진행'}</p>
                      {spot.coupon.remaining !== undefined && (
                        <p className="mt-2 text-xs text-text-secondary">잔여 수량 {spot.coupon.remaining}장</p>
                      )}
                    </div>
                  </div>
                  {spot.coupon.terms && (
                    <p className="mt-4 text-xs text-text-secondary">{spot.coupon.terms}</p>
                  )}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href={spot.couponUrl ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold ${tokens.primaryButton}`}
                    >
                      쿠폰 받기
                    </a>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-text-secondary">
                      <FaBolt /> 실시간 발급
                    </span>
                  </div>
                </section>
              )}

              <section className={`rounded-3xl border border-white/10 p-8 shadow-subtle ${tokens.surface}`}>
                <h2 className="text-2xl font-semibold">갤러리</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {spot.imageUrls?.map((url, index) => (
                    <div key={index} className="overflow-hidden rounded-2xl">
                      <img src={url} alt={`${spot.name} gallery ${index + 1}`} className="h-48 w-full object-cover" />
                    </div>
                  ))}
                </div>
              </section>

              {(spot.amenities?.length || spot.menu?.length || spot.services?.length) && (
                <section className={`rounded-3xl border border-white/10 p-8 shadow-subtle ${tokens.surface}`}>
                  <div className="grid gap-8 lg:grid-cols-2">
                    {spot.amenities && spot.amenities.length > 0 && (
                      <div>
                        <h2 className="text-2xl font-semibold">편의시설</h2>
                        <div className="mt-4 flex flex-wrap gap-3">
                          {spot.amenities.map((amenity) => (
                            <span key={amenity} className={`rounded-full px-4 py-2 text-xs font-semibold ${tokens.outlineChip}`}>
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(spot.menu?.length || spot.services?.length) && (
                      <div className="space-y-6">
                        {spot.menu && spot.menu.length > 0 && (
                          <div>
                            <h2 className="text-2xl font-semibold">메뉴 & 패키지</h2>
                            <ul className="mt-4 space-y-3 text-sm">
                              {spot.menu.map((item, index) => (
                                <li key={index} className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3">
                                  <div>
                                    <p className="font-semibold">{item.name}</p>
                                    {item.description && <p className="text-xs text-text-secondary">{item.description}</p>}
                                  </div>
                                  {item.price && <span className="text-sm font-semibold">{item.price}</span>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {spot.services && spot.services.length > 0 && (
                          <div>
                            <h3 className="text-xl font-semibold">시술 & 서비스</h3>
                            <ul className="mt-4 space-y-3 text-sm">
                              {spot.services.map((service, index) => (
                                <li key={index} className="rounded-2xl border border-white/10 px-4 py-3">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <p className="font-semibold">{service.name}</p>
                                    <div className="flex items-center gap-3 text-xs text-text-secondary">
                                      {service.duration && <span>{service.duration}</span>}
                                      {service.price && <span className="text-sm font-semibold text-inherit">{service.price}</span>}
                                    </div>
                                  </div>
                                  {service.description && <p className="mt-2 text-xs text-text-secondary">{service.description}</p>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section className={`rounded-3xl border border-white/10 p-8 shadow-subtle ${tokens.surface}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold">위치 & 길찾기</h2>
                  <a
                    href={spot.mapUrl ?? `https://www.google.com/maps/search/?api=1&query=${spot.latitude},${spot.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-widest ${tokens.outlineButton}`}
                  >
                    <FaLocationArrow /> 지도 열기
                  </a>
                </div>
                <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
                  {isLoaded ? (
                    <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={15}>
                      <Marker position={mapCenter} />
                    </GoogleMap>
                  ) : loadError ? (
                    <p className="p-6 text-center text-sm text-red-400">현재 지도를 불러올 수 없습니다.</p>
                  ) : (
                    <p className="p-6 text-center text-sm text-text-secondary">지도를 불러오는 중...</p>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                  <span className="inline-flex items-center gap-2"><FaMapMarkerAlt /> {spot.address}</span>
                  {spot.averageSpend && (
                    <span className="inline-flex items-center gap-2"><FaTag /> 1인 평균 {spot.averageSpend}</span>
                  )}
                  {spot.operatingHours && (
                    <span className="inline-flex items-center gap-2"><FaRegClock /> {spot.operatingHours}</span>
                  )}
                </div>
              </section>

              <section className={`rounded-3xl border border-white/10 p-8 shadow-subtle ${tokens.surface}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-[28px] font-semibold leading-tight">리뷰 & 평점</h2>
                    <p className="text-sm text-text-secondary">Verified 뱃지와 키워드 필터로 신뢰를 강화했어요.</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <select
                      value={reviewSort}
                      onChange={(event) => setReviewSort(event.target.value as typeof reviewSort)}
                      className="rounded-xl border border-white/20 bg-transparent px-4 py-2"
                    >
                      <option value="latest">최신순</option>
                      <option value="rating">평점 높은순</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  {reviewKeywordChips.map((keyword) => (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => setKeywordFilter((prev) => (prev === keyword ? '' : keyword))}
                      className={`rounded-full px-4 py-2 text-xs font-semibold ${tokens.outlineChip}`}
                      data-active={keywordFilter === keyword}
                    >
                      #{keyword}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStarFilter((prev) => (prev === star ? null : star))}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${tokens.outlineChip}`}
                      data-active={starFilter === star}
                    >
                      {star}점
                    </button>
                  ))}
                </div>

                {user && (
                  <form onSubmit={handleReviewSubmit} className={`mt-8 space-y-4 rounded-2xl border border-white/10 p-6 ${tokens.surfaceMuted}`}>
                    <h3 className="text-lg font-semibold">리뷰 작성하기</h3>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setNewReview((prev) => ({ ...prev, rating: index + 1 }))}
                          className="text-2xl text-yellow-400"
                        >
                          {newReview.rating >= index + 1 ? <FaStar /> : <FaRegStar className="text-yellow-200/40" />}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={newReview.comment}
                      onChange={(event) => setNewReview((prev) => ({ ...prev, comment: event.target.value }))}
                      placeholder="이 장소의 분위기와 서비스를 자세히 작성해 주세요."
                      className="min-h-[120px] w-full rounded-2xl border border-white/20 bg-transparent p-4 text-sm"
                      required
                    />
                    <button
                      type="submit"
                      className={`flex h-11 w-full items-center justify-center rounded-xl font-semibold ${tokens.primaryButton}`}
                      disabled={addReviewMutation.isLoading}
                    >
                      리뷰 등록
                    </button>
                  </form>
                )}

                <div className="mt-8 space-y-6">
                  {isLoadingReviews ? (
                    <p className="text-sm text-text-secondary">리뷰를 불러오는 중...</p>
                  ) : filteredReviews.length > 0 ? (
                    filteredReviews.map((review) => {
                      const isVerified = review.isVerified || review.author.toLowerCase().includes('verified');

                      return (
                        <div key={review.id} className={`rounded-2xl border border-white/10 p-6 ${tokens.surfaceMuted}`}>
                          <div className="flex flex-wrap items-start gap-4">
                            <img
                              src={review.avatar}
                              alt={review.author}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <p className="font-semibold">{review.isAnonymous ? '게스트' : review.author}</p>
                                {isVerified && (
                                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${tokens.chip}`}>
                                    Verified
                                  </span>
                                )}
                                <span className="text-xs text-text-secondary">
                                  {new Date(review.timestamp).toLocaleDateString()}
                                </span>
                                <button className="ml-auto text-xs text-text-secondary hover:text-primary">신고</button>
                              </div>
                              <div className="mt-2">
                                <ReviewStarRow value={review.rating} />
                              </div>
                              <p className="mt-3 text-sm leading-relaxed text-text-main">{review.comment}</p>
                              {review.photos && review.photos.length > 0 && (
                                <div className="mt-4 flex gap-3">
                                  {review.photos.map((photo, index) => (
                                    <img
                                      key={index}
                                      src={photo}
                                      alt={`review-${review.id}-${index}`}
                                      className="h-20 w-20 rounded-xl object-cover"
                                    />
                                  ))}
                                </div>
                              )}
                              {review.ownerResponse && (
                                <div className="mt-5 rounded-xl border border-white/10 bg-black/5 p-4 text-xs text-text-secondary">
                                  <p className="font-semibold text-text-main">오너 답글</p>
                                  <p className="mt-1 text-text-main">{review.ownerResponse.comment}</p>
                                  <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-text-secondary">
                                    {new Date(review.ownerResponse.timestamp).toLocaleDateString()} · {review.ownerResponse.author}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-text-secondary">아직 등록된 리뷰가 없습니다.</p>
                  )}
                </div>
              </section>

              <section className={`rounded-3xl border border-white/10 p-8 shadow-subtle ${tokens.surface}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold">연관 Spot</h2>
                  <span className="text-sm text-text-secondary">지도와 카드 행동 데이터를 기반으로 추천했어요.</span>
                </div>
                {isLoadingRecommendations ? (
                  <p className="mt-6 text-sm text-text-secondary">추천 스팟을 불러오는 중...</p>
                ) : recommendations && recommendations.length > 0 ? (
                  <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {recommendations.map((rec) => (
                      <Link
                        key={rec.id}
                        to={`/${mode}/spots/${rec.id}`}
                        className={`group overflow-hidden rounded-2xl border border-white/10 ${tokens.surfaceMuted}`}
                      >
                        <div className="relative aspect-[16/9]">
                          <img src={rec.imageUrls?.[0] || rec.imageUrl} alt={rec.name} className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-white">
                            {rec.category}
                          </span>
                        </div>
                        <div className="space-y-2 p-4">
                          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-text-secondary">{rec.region}</p>
                          <h3 className="text-lg font-semibold">{rec.name}</h3>
                          <p className="text-sm text-text-secondary">평점 {rec.rating.toFixed(1)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-text-secondary">연관 스팟 정보가 없습니다.</p>
                )}
              </section>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24">
              <WidgetCard title="내 주변 추천" mode={mode}>
                {recommendations && recommendations.length > 0 ? (
                  <ul className="space-y-3 text-sm">
                    {recommendations.slice(0, 3).map((rec) => (
                      <li key={rec.id} className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{rec.name}</p>
                          <p className="text-xs text-text-secondary">{rec.distanceKm ? `${rec.distanceKm.toFixed(1)}km` : rec.category}</p>
                        </div>
                        <Link
                          to={`/${mode}/spots/${rec.id}`}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${tokens.outlineButton}`}
                        >
                          보기
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-text-secondary">근처 추천 정보를 준비 중입니다.</p>
                )}
              </WidgetCard>

              <WidgetCard title="오픈나우" mode={mode}>
                <p className="flex items-center justify-between text-sm">
                  현재 상태
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${spot.isOpenNow ? tokens.chip : 'bg-black/10 text-text-secondary'}`}>
                    {spot.isOpenNow ? '영업 중' : '운영시간 확인'}
                  </span>
                </p>
                <p className="text-xs text-text-secondary">실시간 운영 정보는 제휴 파트너 기준으로 업데이트됩니다.</p>
              </WidgetCard>

              <WidgetCard title="날씨 & 대체 플랜" mode={mode}>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <FaCloudRain /> 호치민 오늘 비 40%
                </p>
                <p className="text-xs text-text-secondary">우천 시 실내 스팟으로 자동 추천 전환됩니다.</p>
              </WidgetCard>

              <WidgetCard title="환율 변환" mode={mode}>
                <p className="text-sm font-semibold">₩1,000 → ₫{Math.round(1000 * 18.5).toLocaleString()}</p>
                <p className="text-xs text-text-secondary">실시간 환율 (예시) · 수수료 제외</p>
              </WidgetCard>

              <WidgetCard title="교통" mode={mode}>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <FaTrain /> Grab / 대중교통 연동
                </p>
                <p className="text-xs text-text-secondary">Grab 호출, 버스 노선, VinFast 전기 스쿠터 등 이동 옵션 제공</p>
              </WidgetCard>

              <WidgetCard title="eSIM & 데이터" mode={mode}>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <FaWifi /> 5분만에 개통
                </p>
                <p className="text-xs text-text-secondary">제휴 eSIM으로 바로 연결하고 여행 준비를 끝내세요.</p>
                <a
                  href="#"
                  className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold ${tokens.primaryButton}`}
                >
                  eSIM 구매하기
                </a>
              </WidgetCard>

              {mode === 'nightlife' && (
                <WidgetCard title="해피아워" mode={mode}>
                  <p className="text-sm font-semibold">21:00 ~ 23:00</p>
                  <p className="text-xs text-text-secondary">칵테일 2+1 / VIP 테이블 10% 할인</p>
                </WidgetCard>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotDetail;