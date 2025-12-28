// apps/web/src/features/spot/components/detail/SpotCoupon.tsx
import { useEffect, useState } from "react";
import * as SpotApi from "@/api/spot";

type CouponView = {
  id: string;
  title: string;
  description?: string;
  discountLabel?: string;
  validUntilLabel?: string;
};

interface Props {
  spotId: string;
}

async function apiFetchCoupons(spotId: string) {
  const mod: any = SpotApi as any;
  const fn = mod.getCoupons || mod.fetchCoupons;
  if (!fn) return [];

  try {
    const res = await fn(spotId);
    return Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

async function apiRedeemCoupon(spotId: string, couponId: string) {
  const mod: any = SpotApi as any;
  const fn = mod.redeemCoupon || mod.claimCoupon;
  if (!fn) throw new Error("Spot API: redeemCoupon not found");
  return await fn(spotId, couponId);
}

/**
 * SpotCoupon
 * 할인/쿠폰 배너
 */
const SpotCoupon = ({ spotId }: Props) => {
  const [coupons, setCoupons] = useState<CouponView[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!spotId) return;
    let alive = true;

    setLoading(true);
    apiFetchCoupons(spotId)
      .then((list: any[]) => {
        if (!alive) return;

        const mapped: CouponView[] = (list || []).map((c: any) => {
          const valid = c.validUntil ?? c.expiresAt ?? c.endAt ?? null;
          const validLabel =
            valid == null
              ? undefined
              : new Date(valid?.seconds ? valid.seconds * 1000 : valid).toLocaleDateString();

          return {
            id: String(c.id ?? c.couponId ?? ""),
            title: String(c.title ?? c.name ?? "쿠폰"),
            description: c.description ? String(c.description) : undefined,
            discountLabel: c.discount ? String(c.discount) : c.discountPercent ? `${c.discountPercent}%` : undefined,
            validUntilLabel: validLabel,
          };
        });

        setCoupons(mapped.filter((c) => c.id && c.title));
      })
      .catch(() => setCoupons([]))
      .finally(() => setLoading(false));

    return () => {
      alive = false;
    };
  }, [spotId]);

  const handleRedeem = async (couponId: string) => {
    await apiRedeemCoupon(spotId, couponId);
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
          <div key={c.id} className="flex flex-col justify-between rounded-2xl border border-border bg-background-sub p-4 shadow-sm">
            <div>
              <h4 className="text-lg font-semibold text-primary">{c.title}</h4>
              {c.description && <p className="mt-1 text-sm text-text-secondary">{c.description}</p>}
              {c.validUntilLabel && <p className="mt-2 text-sm text-text-tertiary">유효기간: {c.validUntilLabel}</p>}
            </div>
            <button
              onClick={() => handleRedeem(c.id)}
              className="mt-3 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              쿠폰 사용하기 {c.discountLabel ? `(${c.discountLabel})` : ""}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SpotCoupon;
