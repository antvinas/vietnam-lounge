import { useMemo } from "react";
import { FiBell, FiHelpCircle, FiMessageSquare, FiShield, FiChevronRight } from "react-icons/fi";
import toast from "react-hot-toast";

const HelpCenter = () => {
  const items = useMemo(
    () => [
      {
        key: "notice",
        title: "공지사항",
        desc: "서비스 변경 사항과 공지 내용을 확인할 수 있어요.",
        icon: <FiBell size={18} />,
        action: "공지 확인하기",
        onClick: () => toast("공지사항은 준비 중입니다."),
      },
      {
        key: "faq",
        title: "자주 묻는 질문",
        desc: "쿠폰, 리뷰, 계정 관련 질문을 빠르게 해결해 보세요.",
        icon: <FiHelpCircle size={18} />,
        action: "FAQ 보기",
        onClick: () => toast("FAQ는 준비 중입니다."),
      },
      {
        key: "inquiry",
        title: "문의하기",
        desc: "문제가 해결되지 않으면 문의를 남겨 주세요.",
        icon: <FiMessageSquare size={18} />,
        action: "문의 남기기",
        onClick: () => toast("문의하기는 준비 중입니다."),
      },
      {
        key: "policy",
        title: "약관 및 개인정보",
        desc: "약관, 개인정보 처리방침을 확인할 수 있어요.",
        icon: <FiShield size={18} />,
        action: "정책 보기",
        onClick: () => toast("정책 페이지는 준비 중입니다."),
      },
    ],
    []
  );

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">고객센터</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          도움이 필요하신가요? 아래 메뉴에서 빠르게 해결해 보세요.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={it.onClick}
            className="text-left p-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                  {it.icon}
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-gray-900 dark:text-white">{it.title}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{it.desc}</div>
                </div>
              </div>
              <FiChevronRight className="text-gray-300 mt-1" />
            </div>

            <div className="mt-4 text-sm font-bold text-gray-900 dark:text-white">
              {it.action}
            </div>
          </button>
        ))}
      </div>

      {/* 안내 박스 (CS 관점: 기대치 조정) */}
      <div className="p-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="font-bold text-gray-900 dark:text-white">안내</div>
        <ul className="mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc pl-5">
          <li>쿠폰/리뷰/관심 장소 데이터가 보이지 않으면 잠시 후 다시 시도해 주세요.</li>
          <li>계정 관련 문제는 “설정 및 보안”에서 확인할 수 있어요.</li>
        </ul>
      </div>
    </div>
  );
};

export default HelpCenter;
