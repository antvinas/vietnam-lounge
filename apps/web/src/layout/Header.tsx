import { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useSearchParams } from "react-router-dom";
import { FaPlane, FaSun, FaMoon, FaAngleDown } from "react-icons/fa";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import useUiStore from "@/store/ui.store";
import { useAuthStore } from "@/store/auth.store";
import { useStore as useAdultStore } from "@/store/adult.store";
import AdultGate from "@/components/common/AdultGate";

const Header = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn, user, logout } = useAuthStore();
  const { contentMode, setContentMode } = useUiStore();
  const { isAgeVerified, setAgeVerified } = useAdultStore();
  const [isAdultGateOpen, setAdultGateOpen] = useState(false);

  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isNightlife = contentMode === "nightlife";

  const handleNightlifeClick = () => {
    const preference = localStorage.getItem("adult_gate_preference");
    if (isAgeVerified || preference === "hide") {
      setAgeVerified(true);
      setContentMode("nightlife");
    } else {
      setAdultGateOpen(true);
    }
  };

  const handleVerificationSuccess = () => {
    setAgeVerified(true);
    setContentMode("nightlife");
    setAdultGateOpen(false);
  };

  const toggleTheme = () => {
    const { themeMode, setThemeMode } = useUiStore.getState();
    setThemeMode(themeMode === "light" ? "dark" : "light");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "bg-primary text-white"
        : "text-text-secondary hover:text-text-main"
    }`;

  const authLinkClass =
    "text-sm font-medium text-text-secondary transition-colors hover:text-text-main";

  useEffect(() => {
    if (isMobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [location.pathname]);

  const MainNav = () => (
    <nav className="flex flex-col md:flex-row md:items-center md:gap-1">
      <NavLink to="/spots" className={navLinkClass}>
        스팟
      </NavLink>
      <NavLink to="/plan" className={navLinkClass}>
        플랜
      </NavLink>
      <NavLink to="/community" className={navLinkClass}>
        라운지
      </NavLink>
      <NavLink to="/events" className={navLinkClass}>
        이벤트
      </NavLink>
    </nav>
  );

  const AuthNav = () => (
    <div className="flex items-center gap-4">
      {isLoggedIn ? (
        <div className="relative group">
          <button className="flex items-center gap-2 text-sm font-medium text-text-main">
            <img
              src={
                user?.profilePicture ||
                `https://ui-avatars.com/api/?name=${user?.username}&background=random`
              }
              alt="User"
              className="h-7 w-7 rounded-full"
            />
            <FaAngleDown
              size={14}
              className="text-text-secondary transition-transform group-hover:rotate-180"
            />
          </button>
          <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-surface shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div className="py-1">
              <NavLink
                to="/mypage"
                className="block px-4 py-2 text-sm text-text-main hover:bg-background"
              >
                마이페이지
              </NavLink>
              {user?.role === "admin" && (
                <NavLink
                  to="/admin"
                  className="block px-4 py-2 text-sm text-text-main hover:bg-background"
                >
                  관리자
                </NavLink>
              )}
              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-sm text-text-main hover:bg-background"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <NavLink to="/login" className={authLinkClass}>
            로그인
          </NavLink>
          <NavLink
            to="/register"
            className={`${authLinkClass} rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2`}
          >
            회원가입
          </NavLink>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 md:px-10 lg:px-20">
        {/* Left Section: Logo + Nav */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <FaPlane className="text-xl text-primary" />
            <span className="text-lg font-bold text-text-main">
              베트남 라운지
            </span>
            <span className="ml-2 hidden text-xs font-medium text-text-secondary md:inline">
              Explore Vietnam
            </span>
          </Link>
          <div className="hidden md:flex">
            <MainNav />
          </div>
        </div>

        {/* Right Section */}
        <div className="hidden md:flex items-center gap-4">
          {/* Mode Toggle */}
          <div className="flex items-center rounded-full border border-border p-0.5 text-sm font-semibold">
            <button
              onClick={() => setContentMode("explorer")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors ${
                !isNightlife
                  ? "bg-mint-100 text-mint-800"
                  : "text-text-secondary"
              }`}
            >
              Explorer
            </button>
            <button
              onClick={handleNightlifeClick}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors ${
                isNightlife ? "bg-purple-600 text-white" : "text-text-secondary"
              }`}
            >
              Nightlife
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Toggle theme"
          >
            {useUiStore.getState().themeMode === "light" ? (
              <FaMoon size={16} />
            ) : (
              <FaSun size={16} className="text-yellow-400" />
            )}
          </button>

          <div className="h-6 w-px bg-border" />
          <AuthNav />
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-text-main"
          >
            {isMobileMenuOpen ? (
              <HiOutlineX size={24} />
            ) : (
              <HiOutlineMenu size={24} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface/95">
          <div className="space-y-4 p-4">
            {/* Mode Toggle */}
            <div className="flex justify-center">
              <div className="flex items-center rounded-full border border-border p-0.5 text-sm font-semibold">
                <button
                  onClick={() => setContentMode("explorer")}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors ${
                    !isNightlife
                      ? "bg-mint-100 text-mint-800"
                      : "text-text-secondary"
                  }`}
                >
                  Explorer
                </button>
                <button
                  onClick={handleNightlifeClick}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors ${
                    isNightlife
                      ? "bg-purple-600 text-white"
                      : "text-text-secondary"
                  }`}
                >
                  Nightlife
                </button>
              </div>
            </div>

            <MainNav />

            <div className="border-t border-border pt-4">
              <AuthNav />
            </div>

            <div className="border-t border-border pt-4 flex justify-center">
              <button
                onClick={toggleTheme}
                className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-black/5 dark:hover:bg-white/10"
              >
                {useUiStore.getState().themeMode === "light" ? (
                  <FaMoon size={16} />
                ) : (
                  <FaSun size={16} className="text-yellow-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdultGateOpen && (
        <AdultGate
          onSuccess={handleVerificationSuccess}
          onCancel={() => setAdultGateOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
