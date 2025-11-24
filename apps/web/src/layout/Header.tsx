// src/layout/Header.tsx
import { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaPlane, FaSun, FaMoon } from "react-icons/fa";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import useUiStore from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { useStore as useAdultStore } from "@/store/adult.store";
import AdultGate from "@/components/common/AdultGate";

const Header = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn, user, logout } = useAuthStore();
  const { contentMode, setContentMode, themeMode, setThemeMode } = useUiStore();
  const { isAgeVerified, setAgeVerified } = useAdultStore();
  const [isAdultGateOpen, setAdultGateOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isNightlife = contentMode === "nightlife";

  const handleNightlifeClick = () => {
    if (isAgeVerified) {
      setContentMode("nightlife");
      navigate("/adult", { replace: true });
      toast("🌙 Nightlife 모드로 전환됨", { duration: 1200, position: "top-center" });
    } else {
      setAdultGateOpen(true);
    }
  };

  const handleVerificationSuccess = () => {
    setAgeVerified(true);
    setContentMode("nightlife");
    setAdultGateOpen(false);
    navigate("/adult", { replace: true });
  };

  const toggleTheme = () => {
    const next = themeMode === "light" ? "dark" : "light";
    setThemeMode(next);
    toast.dismiss();
    toast(next === "dark" ? "🌙 다크모드 ON" : "☀️ 라이트모드 ON", { duration: 1000, position: "top-center" });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? "text-primary font-semibold" : "text-text-secondary hover:text-text-main"
    }`;

  useEffect(() => {
    if (isMobileMenuOpen) setMobileMenuOpen(false);
  }, [location.pathname, isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 dark:bg-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 md:px-10 lg:px-20">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <FaPlane className="text-xl text-primary" />
            <span className="text-lg font-bold text-text-main">베트남 라운지</span>
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            <NavLink to="/spots" className={navLinkClass}>스팟</NavLink>
            <NavLink to="/plan" className={navLinkClass}>플랜</NavLink> {/* 플랜 복구 */}
            <NavLink to="/events" className={navLinkClass}>이벤트</NavLink>
          </nav>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center rounded-full border border-border bg-surface/60 p-0.5 text-sm font-semibold">
            <button
              onClick={() => {
                setContentMode("explorer");
                navigate("/", { replace: false });
              }}
              className={`rounded-full px-3 py-1 ${!isNightlife ? "bg-primary text-white" : "text-text-secondary"}`}
              aria-pressed={!isNightlife}
            >
              Explorer
            </button>
            <button
              onClick={handleNightlifeClick}
              className={`rounded-full px-3 py-1 ${isNightlife ? "bg-secondary text-white" : "text-text-secondary"}`}
              aria-pressed={isNightlife}
            >
              Nightlife
            </button>
          </div>

          <button
            onClick={() => navigate("/sponsor/info")}
            className="rounded-full px-4 py-2 text-sm font-semibold text-black dark:text-white
                       bg-gradient-to-r from-amber-300 to-pink-300 dark:from-purple-500 dark:to-pink-500
                       shadow-md hover:opacity-90"
            aria-label="광고 문의"
          >
            광고 문의
          </button>

          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-black/5 dark:hover:bg-white/10"
            title="테마 전환"
            aria-label="테마 전환"
            aria-pressed={themeMode === "dark"}
          >
            <AnimatePresence mode="wait" initial={false}>
              {themeMode === "dark" ? (
                <motion.div key="sun" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                  <FaSun />
                </motion.div>
              ) : (
                <motion.div key="moon" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }}>
                  <FaMoon />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {isLoggedIn ? (
            <div className="group relative">
              <button className="flex items-center gap-2 text-sm font-medium text-text-main">
                <img
                  src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.username}&background=random`}
                  alt="User"
                  className="h-7 w-7 rounded-full"
                  loading="lazy"
                  decoding="async"
                  sizes="28px"
                />
              </button>
              <div className="invisible absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-surface shadow-lg ring-1 ring-border transition-all group-hover:visible group-hover:opacity-100 opacity-0">
                <Link to="/mypage" className="block px-4 py-2 text-sm hover:bg-background-sub">마이페이지</Link>
                {user?.role === "admin" && (
                  <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-background-sub">관리자</Link>
                )}
                <button onClick={logout} className="block w-full px-4 py-2 text-left text-sm hover:bg-background-sub">로그아웃</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm text-text-secondary hover:text-text-main">로그인</Link>
              <Link to="/register" className="rounded-full bg-primary px-4 py-2 text-sm text-white hover:opacity-90">회원가입</Link>
            </div>
          )}
        </div>

        <button
          onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-text-main md:hidden"
          aria-expanded={isMobileMenuOpen}
          aria-label="모바일 메뉴 토글"
        >
          {isMobileMenuOpen ? <HiOutlineX size={22} /> : <HiOutlineMenu size={22} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="bg-background-sub/95 dark:bg-surface/95 border-t border-border md:hidden">
          <div className="p-4 space-y-4">
            <NavLink to="/spots" className="block text-sm text-text-main">스팟</NavLink>
            <NavLink to="/plan" className="block text-sm text-text-main">플랜</NavLink> {/* 플랜 복구 */}
            <NavLink to="/events" className="block text-sm text-text-main">이벤트</NavLink>
            <Link
              to="/sponsor/info"
              className="mt-2 inline-block rounded-full bg-gradient-to-r from-amber-300 to-pink-300 dark:from-purple-500 dark:to-pink-500 px-4 py-2 text-sm font-semibold text-black dark:text-white"
            >
              광고 문의
            </Link>
          </div>
        </div>
      )}

      {isAdultGateOpen && (
        <AdultGate onSuccess={handleVerificationSuccess} onCancel={() => setAdultGateOpen(false)} />
      )}
    </header>
  );
};

export default Header;
