import { Fragment, useMemo } from "react";
import { Link } from "react-router-dom";
import { FiTag } from "react-icons/fi";
import type { Spot } from "@/types/spot";

type Props = {
  spots: Spot[];
  max?: number;
  mode?: "explorer" | "nightlife";
  title?: string;
  description?: string;
  className?: string;
};

export default function CouponWidget({
  spots,
  max = 2,
  mode = "explorer",
  title = "쿠폰 & 핫딜",
  description = "플랫폼 전용 혜택",
  className = "",
}: Props) {
  const items = useMemo(
    () => spots?.filter((s) => s.hasCoupon).slice(0, max),
    [spots, max]
  );

  const badge =
    mode === "nightlife"
      ? "bg-[#8B5CF6]/10 text-[#C4B5FD]"
      : "bg-[#2BB6C5]/10 text-[#107380]";

  return (
    <section
      className={`rounded-3xl bg-background-sub p-6 shadow-lg shadow-black/5 ring-1 ring-border/60 ${className}`}
    >
      <header className="mb-4 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {description}
        </p>
        <h3 className="text-xl font-semibold text-text-main">{title}</h3>
      </header>

      {items?.length ? (
        <div className="space-y-4">
          {items.map((spot, i) => (
            <Fragment key={spot.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-main">
                    {spot.name}
                  </p>
                  <p className="truncate text-xs text-text-secondary">
                    {spot.coupon?.description || "상세 조건은 스팟 상세에서 확인"}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>
                  쿠폰 보유
                </span>
              </div>
              {spot.coupon?.expiresAt && (
                <p className="text-xs text-text-secondary">
                  만료일: {spot.coupon.expiresAt}
                </p>
              )}
              {i < items.length - 1 && <hr className="border-border/60" />}
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
    </section>
  );
}
