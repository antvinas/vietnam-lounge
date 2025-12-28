// apps/web/src/features/spot/components/detail/SpotActionBar.tsx
import { useState, useEffect } from "react";
import { FiShare2 } from "react-icons/fi";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Spot } from "@/types/spot";
import toast from "react-hot-toast";
import { useAuthStore } from "@/features/auth/stores/auth.store";

// 실제 API 함수 (API 구현 후 주석 해제)
// import { toggleFavorite, getMyFavorites } from "@/features/User/api/user.api";

// 임시 Mock API (백엔드 연동 전용)
const mockToggleFavorite = async (spotId: string) => {
  return new Promise((resolve) => setTimeout(resolve, 300));
};

type Props = {
  spot: Spot;
  className?: string;
};

export default function SpotActionBar({ spot, className = "" }: Props) {
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuthStore();
  
  // TODO: React Query로 초기 상태 로드 (getMyFavorites 결과 내 존재 여부 확인)
  // const { data: favorites } = useQuery(...) 
  const [isFavorited, setIsFavorited] = useState(false);

  // 낙관적 UI 적용 Mutation
  const { mutate: toggleLike } = useMutation({
    mutationFn: () => mockToggleFavorite(spot.id), // 실제로는 toggleFavorite(spot.id, isFavorited)
    onMutate: async () => {
      if (!isLoggedIn) {
        toast.error("로그인이 필요한 서비스입니다.");
        throw new Error("Unauthorized");
      }

      // 1. 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ["favorite", spot.id] });

      // 2. 이전 상태 스냅샷 저장
      const previousState = isFavorited;

      // 3. UI 즉시 업데이트 (낙관적 업데이트)
      setIsFavorited((prev) => !prev);
      
      // 사용자 피드백 (토스트)
      if (!isFavorited) {
        toast.success("관심 장소에 저장되었어요! 📂", {
          icon: "❤️",
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        });
      }

      return { previousState };
    },
    onError: (err: any, newTodo, context) => {
      if (err.message === "Unauthorized") return;

      // 에러 발생 시 롤백
      if (context?.previousState !== undefined) {
        setIsFavorited(context.previousState);
      }
      toast.error("저장에 실패했습니다. 다시 시도해주세요.");
    },
    onSettled: () => {
      // 성공/실패 후 최신 데이터 동기화 (필요 시)
      queryClient.invalidateQueries({ queryKey: ["favoriteSpots"] });
    },
  });

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ 
          title: spot.name, 
          text: `[VN Lounge] ${spot.name} - 베트남 여행 추천 스팟`, 
          url 
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("링크가 복사되었습니다.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 공유 버튼 */}
      <button
        onClick={handleShare}
        className="p-2.5 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all active:scale-90 bg-gray-50"
        aria-label="공유하기"
      >
        <FiShare2 size={20} />
      </button>

      {/* 찜하기(하트) 버튼 */}
      <button
        onClick={() => toggleLike()}
        className={`p-2.5 rounded-full transition-all duration-300 active:scale-75 shadow-sm ${
          isFavorited 
            ? "text-red-500 bg-red-50 hover:bg-red-100" 
            : "text-gray-400 hover:text-red-500 hover:bg-gray-100 bg-gray-50"
        }`}
        aria-label="관심 장소 저장"
      >
        {isFavorited ? (
          <FaHeart size={20} className="animate-heart-pop" />
        ) : (
          <FaRegHeart size={20} />
        )}
      </button>
    </div>
  );
}