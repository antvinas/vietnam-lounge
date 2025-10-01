import { SpotCoupon } from '@/types/spot';
import { redeemCoupon } from '@/api/spots.api';
import { useState } from 'react';

interface CouponCardProps {
  coupon: SpotCoupon;
  spotId: string;
}

const CouponCard = ({ coupon, spotId }: CouponCardProps) => {
  const [redeemed, setRedeemed] = useState(false);

  const handleRedeem = async () => {
    try {
      await redeemCoupon(spotId, coupon.title);
      setRedeemed(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="rounded-xl border border-violet-300 bg-violet-50 p-6 shadow-md">
      <h3 className="text-lg font-semibold text-violet-700">{coupon.title}</h3>
      <p className="mt-2 text-sm text-text-secondary">{coupon.description}</p>
      <p className="mt-2 text-xs text-gray-500">유효기간: {coupon.expiresAt || '제한 없음'}</p>
      <p className="mt-1 text-xs text-gray-500">남은 수량: {coupon.remaining ?? '∞'}</p>

      <button
        onClick={handleRedeem}
        disabled={redeemed}
        className="mt-4 w-full rounded-lg bg-violet-600 px-4 py-2 text-white hover:bg-violet-700 disabled:bg-gray-400"
      >
        {redeemed ? '발급 완료' : coupon.ctaLabel || '쿠폰 받기'}
      </button>
    </div>
  );
};

export default CouponCard;