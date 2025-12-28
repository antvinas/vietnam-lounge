import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/stores/auth.store"; // 본인의 auth store 경로
import { FaUser, FaTicketAlt, FaCog, FaSignOutAlt, FaHeart } from "react-icons/fa";

export default function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore(); // zustand store에서 가져옴
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsOpen(false);
  };

  // 유저 정보가 없으면 로그인 버튼 등을 보여줘야 함 (Header에서 처리하겠지만 안전장치)
  if (!user) return null;

  // 아바타 이미지 (없으면 이니셜)
  const avatarUrl = user.photoURL || `https://ui-avatars.com/api/?name=${user.email?.substring(0, 2)}&background=10B981&color=fff`;

  return (
    <div className="relative" ref={menuRef}>
      {/* 1. Trigger (아바타) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-full border p-1 transition-all ${
          isOpen ? "border-green-500 ring-2 ring-green-100" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <img
          src={avatarUrl}
          alt="User Avatar"
          className="h-9 w-9 rounded-full object-cover"
        />
        {/* PC에서는 이름 살짝 보여주기 (선택사항) */}
        <span className="hidden pr-2 text-sm font-semibold text-gray-700 md:block">
          {user.displayName || user.email?.split("@")[0]}
        </span>
      </button>

      {/* 2. Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-64 origin-top-right animate-fade-in-down rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 z-50">
          
          {/* 유저 요약 정보 */}
          <div className="mb-2 border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-bold text-gray-900 truncate">
              {user.displayName || "Vietnam Lounge User"}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          {/* 메뉴 리스트 */}
          <div className="flex flex-col gap-1">
            <MenuItem to="/mypage" icon={<FaUser />} label="마이페이지" onClick={() => setIsOpen(false)} />
            <MenuItem to="/mypage/favorites" icon={<FaHeart />} label="관심 장소" onClick={() => setIsOpen(false)} />
            <MenuItem to="/mypage/coupons" icon={<FaTicketAlt />} label="내 쿠폰함" onClick={() => setIsOpen(false)} />
            <MenuItem to="/mypage/settings" icon={<FaCog />} label="설정" onClick={() => setIsOpen(false)} />
          </div>

          <div className="mt-2 border-t border-gray-100 pt-2">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <FaSignOutAlt />
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 메뉴 아이템 컴포넌트 (재사용)
function MenuItem({ to, icon, label, onClick }: { to: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-colors"
    >
      <span className="text-gray-400 group-hover:text-green-500">{icon}</span>
      {label}
    </Link>
  );
}