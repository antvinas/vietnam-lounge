/**
 * 광고 안내 / 제휴 문의 페이지
 * - 비로그인 사용자도 접근 가능
 * - 로그인 시 "내 매장 등록하기" 버튼 노출
 */

import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/config/firebase";
import Button from "@/components/common/Button";

const SponsorInfo = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  const handleApplyClick = () => {
    if (!user) {
      alert("로그인 후 매장 등록이 가능합니다.");
      navigate("/login");
      return;
    }
    navigate("/sponsor/apply");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-950">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-4">
          광고 및 제휴 문의
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          베트남 라운지는 여행자와 현지 비즈니스를 연결하는 플랫폼입니다.
          <br />
          여러분의 매장, 브랜드, 서비스를 더 많은 여행자에게 알리고 싶다면
          아래 방법으로 문의해주세요.
        </p>

        {/* 안내 카드 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-zinc-800/50 shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              📍 스팟 / 매장 등록
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
              카페, 레스토랑, 바, 클럽, 숙소 등 여행자들이 방문할 수 있는
              장소를 등록하세요.
              <br />
              프리미엄 광고로 상단 노출 및 추천 스팟 영역에도 표시됩니다.
            </p>
            <Button
              onClick={handleApplyClick}
              variant="primary"
              className="w-full"
            >
              {user ? "내 매장 등록하기" : "로그인 후 등록하기"}
            </Button>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-zinc-800/50 shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              🤝 제휴 / 광고 문의
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
              여행 관련 브랜드, 콘텐츠 크리에이터, 이벤트 운영자와의 제휴도
              환영합니다.
              <br />
              아래 이메일로 문의 주시면 담당자가 빠르게 답변드리겠습니다.
            </p>
            <div className="text-center font-medium text-amber-600 dark:text-amber-400 mb-4">
              📧 contact@vietnamlounge.com
            </div>
            <Button
              onClick={() =>
                (window.location.href = "mailto:contact@vietnamlounge.com")
              }
              variant="outline"
              className="w-full"
            >
              이메일 문의하기
            </Button>
          </div>
        </div>

        {/* 추가 안내 */}
        <div className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          광고 등록 및 제휴 문의는 베트남 라운지 운영팀이 직접 검토 후 승인됩니다.
          <br />
          비즈니스 문의 이외의 일반 문의는 커뮤니티 탭을 이용해주세요.
        </div>
      </div>
    </div>
  );
};

export default SponsorInfo;
