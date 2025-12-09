import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaHeart, FaTicketAlt, FaChartPie, FaSignOutAlt, FaCog } from "react-icons/fa";
import { useAuthStore } from "@/features/auth/stores/auth.store";

// 컴포넌트 Import
import MyPageOverview from "./MyPageOverview";
import Settings from "./Settings";
import MyFavorites from "./MyFavorites";
import MyCoupons from "./MyCoupons";

const MyPageHome = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  
  // ✅ 기본 탭을 'overview'로 변경
  const [activeTab, setActiveTab] = useState<"overview" | "settings" | "my-favorites" | "my-coupons">("overview");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const tabs = [
    { id: "overview", label: "내 활동 요약", icon: <FaChartPie /> },
    { id: "my-coupons", label: "내 쿠폰함", icon: <FaTicketAlt /> },
    { id: "my-favorites", label: "관심 장소", icon: <FaHeart /> },
    { id: "settings", label: "설정 및 보안", icon: <FaCog /> },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return <MyPageOverview />;
      case "settings": return <Settings />;
      case "my-favorites": return <MyFavorites />;
      case "my-coupons": return <MyCoupons />;
      default: return <MyPageOverview />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* 좌측 사이드바 메뉴 */}
        <aside className="w-full md:w-1/4 shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-24">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <h2 className="font-bold text-gray-900 dark:text-white">마이페이지</h2>
            </div>
            <ul className="p-2 space-y-1">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 font-bold"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span className={activeTab === tab.id ? "text-purple-600" : "text-gray-400"}>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            
            <div className="p-2 mt-2 border-t border-gray-100 dark:border-gray-700">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                <FaSignOutAlt /> 로그아웃
              </button>
            </div>
          </div>
        </aside>

        {/* 우측 메인 컨텐츠 */}
        <main className="w-full md:w-3/4 min-h-[500px]">
          {/* 컨텐츠 래퍼 (애니메이션 효과) */}
          <div className="animate-fadeIn">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyPageHome;