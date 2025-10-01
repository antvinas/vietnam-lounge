import { Link } from "react-router-dom";
import { Fragment, useMemo, type ReactNode } from "react";
import { FiClock, FiMapPin, FiTag } from "react-icons/fi";

import type { Spot } from "@/types/spot";
import ExchangeRateWidget from "@/components/widgets/ExchangeRateWidget";
import WeatherWidget from "@/components/widgets/WeatherWidget";

interface SpotWidgetsPanelProps {
  spots: Spot[];
  mode: "explorer" | "nightlife";
  className?: string;
}

const WidgetCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <section className="rounded-3xl bg-background-sub p-6 shadow-lg shadow-black/5 ring-1 ring-border/60">
    <header className="mb-4 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{description}</p>
      <h3 className="text-xl font-semibold text-text-main">{title}</h3>
    </header>
    {children}
  </section>
);

const InlineListItem = ({
  spot,
  meta,
  icon,
}: {
  spot: Spot;
  meta: string;
  icon: ReactNode;
}) => (
  <Link
    to={`/spots/${spot.id}`}
    className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3 transition hover:border-transparent hover:bg-primary/10"
  >
    <span className="mt-1 text-lg text-primary" aria-hidden>
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-text-main group-hover:text-primary">
        {spot.name}
      </p>
      <p className="truncate text-xs text-text-secondary">{meta}</p>
    </div>
  </Link>
);

const SpotWidgetsPanel = ({ spots, mode, className }: SpotWidgetsPanelProps) => {
  const accentBadgeClass =
    mode === "nightlife"
      ? "bg-[#8B5CF6]/10 text-[#C4B5FD]"
      : "bg-[#2BB6C5]/10 text-[#107380]";

  const nearbySpots = useMemo(
    () =>
      spots
        .filter((spot) => typeof spot.distanceKm === "number")
        .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
        .slice(0, 3),
    [spots]
  );

  const openNowSpots = useMemo(
    () => spots.filter((spot) => spot.isOpenNow).slice(0, 3),
    [spots]
  );

  const couponSpots = useMemo(
    () => spots.filter((spot) => spot.hasCoupon).slice(0, 2),
    [spots]
  );

  return (
    <div className={`flex flex-col gap-6 ${className ?? ""}`}>
      <WeatherWidget />
      <ExchangeRateWidget />

      <WidgetCard title="내 주변 추천" description="반경 3km 이내 스팟">
        {nearbySpots.length ? (
          <div className="space-y-3">
            {nearbySpots.map((spot) => (
              <InlineListItem
                key={spot.id}
                spot={spot}
                meta={`${spot.distanceKm?.toFixed(2)}km · ${spot.category}`}
                icon={<FiMapPin />}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            거리를 확인할 수 있는 스팟이 아직 없어요. 위치 정보가 있는 스팟이 추가되면 자동으로 보여드릴게요.
          </p>
        )}
      </WidgetCard>

      <WidgetCard title="오픈 나우" description="지금 바로 방문 가능한 장소">
        {openNowSpots.length ? (
          <div className="space-y-3">
            {openNowSpots.map((spot) => (
              <InlineListItem
                key={spot.id}
                spot={spot}
                meta={spot.operatingHours || "운영시간 정보 업데이트 예정"}
                icon={<FiClock />}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            현재 영업 중인 스팟이 없거나, 운영 시간이 등록되지 않았어요.
          </p>
        )}
      </WidgetCard>

      <WidgetCard title="쿠폰 & 핫딜" description="플랫폼 전용 혜택">
        {couponSpots.length ? (
          <div className="space-y-4">
            {couponSpots.map((spot, index) => (
              <Fragment key={spot.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-main">{spot.name}</p>
                    <p className="truncate text-xs text-text-secondary">
                      {spot.coupon?.description || "상세 조건은 스팟 상세에서 확인"}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${accentBadgeClass}`}>
                    쿠폰 보유
                  </span>
                </div>
                {spot.coupon?.expiresAt && (
                  <p className="text-xs text-text-secondary">만료일: {spot.coupon.expiresAt}</p>
                )}
                {index < couponSpots.length - 1 && <hr className="border-border/60" />}
              </Fragment>
            ))}
            <Link
              to="/events"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              더 많은 쿠폰 보기
              <FiTag aria-hidden />
            </Link>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            아직 등록된 쿠폰이 없어요. 신규 프로모션이 열리면 가장 먼저 알려드릴게요.
          </p>
        )}
      </WidgetCard>
    </div>
  );
};

export default SpotWidgetsPanel;