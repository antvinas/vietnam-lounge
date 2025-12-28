// src/components/widgets/CouponWidget.tsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { FaTicketAlt, FaChevronRight } from "react-icons/fa";
import { useSpotsQuery } from "@/features/spot/hooks/useSpotsQuery";
import type { Spot } from "@/types/spot";
import useUiStore from "@/store/ui.store";

interface Props {
  max?: number;
}

export default function CouponWidget({ max = 3 }: Props) {
  const { spots } = useSpotsQuery();
  const { contentMode } = useUiStore();
  const isNight = contentMode === "nightlife";

  // 쿠폰이 있는 스팟만 필터링
  const couponSpots = useMemo(() => {
    if (!spots) return [];
    
    // 1. coupons 배열이 있고 비어있지 않은 경우
    // 2. 또는 legacy 필드 hasCoupon이 true인 경우
    return spots.filter((s) => 
      (s.coupons && s.coupons.length > 0) || s.hasCoupon
    ).slice(0, max);
  }, [spots, max]);

  if (couponSpots.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
      
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <FaTicketAlt />
          이달의 혜택
        </h3>
        <Link to="/events" className="text-xs font-medium bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition">
          더보기
        </Link>
      </div>

      <div className="space-y-3 relative z-10">
        {couponSpots.map((spot) => {
          // 사용할 쿠폰 정보 추출 (배열의 첫 번째 또는 레거시 필드)
          const displayCoupon = spot.coupons?.[0] || spot.coupon;
          
          return (
            <Link 
              key={spot.id} 
              to={isNight ? `/adult/spots/${spot.id}` : `/spots/${spot.id}`}
              className="block bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:bg-white/20 transition group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-sm truncate pr-2">{spot.name}</div>
                  <div className="text-xs text-pink-100 mt-0.5 line-clamp-1">
                    {displayCoupon?.description || "상세 혜택은 상세페이지에서 확인"}
                  </div>
                </div>
                {displayCoupon?.discountAmount && (
                   <div className="bg-white text-pink-600 text-xs font-bold px-1.5 py-0.5 rounded shadow-sm">
                      {displayCoupon.discountType === 'percentage' 
                        ? `${displayCoupon.discountAmount}%` 
                        : `-${displayCoupon.discountAmount}`}
                   </div>
                )}
              </div>
              
              <div className="mt-2 flex justify-between items-center text-[10px] text-pink-200">
                <span>
                   {displayCoupon?.validUntil 
                     ? `~${displayCoupon.validUntil}까지` 
                     : displayCoupon?.expiresAt // 호환성 처리
                       ? `~${displayCoupon.expiresAt}까지`
                       : "기간 한정"}
                </span>
                <FaChevronRight className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}