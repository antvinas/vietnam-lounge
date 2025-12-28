import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaHeart,
  FaTicketAlt,
  FaChartPie,
  FaSignOutAlt,
  FaCog,
  FaUserShield,
} from "react-icons/fa";
import { FiHelpCircle } from "react-icons/fi";
import { useAuthStore } from "@/features/auth/stores/auth.store";

// 컴포넌트 Import
import MyPageOverview from "./MyPageOverview";
import Settings from "./Settings";
import MyFavorites from "./MyFavorites";
import MyCoupons from "./MyCoupons";
import MyReviews from "./MyReviews";
import HelpCenter from "./HelpCenter";

type TabId =
  | "overview"
  | "settings"
  | "my-favorites"
  | "my-coupons"
  | "my-reviews"
  | "help-center";

const MyPageHome = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // ✅ 단일 기준: custom claims
  const isAdmin = useMemo(() => {
    const c: any = user?.claims || {};
    return c?.superAdmin === true || c?.admin === true || c?.isAdmin === true;
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const tabs = [
    { id: "overview", label: "마이 홈", icon: <FaChartPie /> },
    { id: "my-coupons", label: "내 쿠폰", icon: <FaTicketAlt /> },
    { id: "my-favorites", label: "관심 장소", icon: <FaHeart /> },
    { id: "my-reviews", label: "내 리뷰", icon: <FaUser /> },
    { id: "settings", label: "설정 및 보안", icon: <FaCog /> },
    { id: "help-center", label: "고객센터", icon: <FiHelpCircle /> },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <MyPageOverview />;
      case "my-coupons":
        return <MyCoupons />;
      case "my-favorites":
        return <MyFavorites />;
      case "my-reviews":
        return <MyReviews />;
      case "settings":
        return <Settings />;
      case "help-center":
        return <HelpCenter />;
      default:
        return <MyPageOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sticky top-24">
              {isAdmin && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => navigate("/admin")}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-extrabold bg-black text-white hover:opacity-90"
                    aria-label="관리자 콘솔로 이동"
                    title="관리자 콘솔"
                  >
                    <FaUserShield /> 관리자 콘솔
                  </button>
                  <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                    운영/관리 권한이 있는 계정만 접근 가능합니다.
                  </p>
                </div>
              )}

              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    aria-current={activeTab === tab.id ? "page" : undefined}
                  >
                    <span className={activeTab === tab.id ? "" : "text-gray-400"}>
                      {tab.icon}
                    </span>
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                  <FaSignOutAlt /> 로그아웃
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-h-[600px]">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default MyPageHome;
