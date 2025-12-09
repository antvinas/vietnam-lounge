import { useEffect, useState } from "react";
import { fetchCoupons, redeemCoupon } from "@/api/spots.api";

interface Coupon {
  id: string;
  title: string;
  description: string;
  discount: string;
  validUntil: string;
}

interface Props {
  spotId: string;
}

/**
 * SpotCoupon
 * 할인/쿠폰 배너
 */
const SpotCoupon = ({ spotId }: Props) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!spotId) return;
    setLoading(true);
    fetchCoupons(spotId)
      .then((res) => setCoupons(res))
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));
  }, [spotId]);

  const handleRedeem = async (couponId: string) => {
    await redeemCoupon(spotId, couponId);
    alert("쿠폰이 적용되었습니다!");
  };

  if (loading)
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-sm text-text-secondary">
        쿠폰 정보를 불러오는 중...
      </div>
    );

  if (coupons.length === 0) return null;

  return (
    <section className="mt-10 rounded-3xl border border-border bg-surface p-5 md:p-6">
      <h3 className="text-xl font-bold text-text-main mb-4">할인 쿠폰</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {coupons.map((c) => (
          <div
            key={c.id}
            className="flex flex-col justify-between rounded-2xl border border-border bg-background-sub p-4 shadow-sm"
          >
            <div>
              <h4 className="text-lg font-semibold text-primary">{c.title}</h4>
              <p className="mt-1 text-sm text-text-secondary">{c.description}</p>
              <p className="mt-2 text-sm text-text-tertiary">
                유효기간: {new Date(c.validUntil).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => handleRedeem(c.id)}
              className="mt-3 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              쿠폰 사용하기 ({c.discount})
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SpotCoupon;
