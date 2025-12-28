import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaPlane, FaSun, FaMoon, FaGlassMartiniAlt } from "react-icons/fa";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import { AnimatePresence, motion } from "framer-motion";

import useUiStore from "@/store/ui.store";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useStore as useAdultStore } from "@/features/Adult/stores/adult.store";
import AdultGate from "@/features/Adult/components/AdultGate";
import UserMenu from "./UserMenu";

const Header = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn } = useAuthStore();

  // UI Store
  const { contentMode, setContentMode, themeMode, setThemeMode } = useUiStore();
  const { isAgeVerified, setAgeVerified } = useAdultStore();
  const [isAdultGateOpen, setAdultGateOpen] = useState(false);

  const navigate = useNavigate();
  const isNightlife = contentMode === "nightlife";

  // Nightlife 모드 클릭 핸들러
  const handleNightlifeClick = () => {
    if (isAgeVerified) {
      setContentMode("nightlife");
      navigate("/adult", { replace: true });
    } else {
      setAdultGateOpen(true);
    }
  };

  // Explorer 모드 클릭 핸들러
  const handleDaylifeClick = () => {
    setContentMode("explorer");
    // ✅ 이전 코드: setThemeMode("light") 강제 -> 제거
    navigate("/", { replace: true });
  };

  // 성인 인증 통과
  const handleGatePass = () => {
    setAgeVerified(true);
    setAdultGateOpen(false);
    setContentMode("nightlife");
    navigate("/adult", { replace: true });
  };

  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-all duration-200 ${
      isActive
        ? isNightlife
          ? "text-fuchsia-400 font-bold drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]"
          : "text-blue-600 font-bold"
        : "text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
    }`;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || isMobileMenuOpen
            ? "bg-white/90 backdrop-blur-md shadow-sm dark:bg-gray-900/90 dark:border-b dark:border-gray-800"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          {/* 1. 로고 */}
          <Link to={isNightlife ? "/adult" : "/"} className="flex items-center gap-2 group">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-500 ${
                isNightlife
                  ? "bg-gradient-to-br from-purple-700 to-pink-600 shadow-lg group-hover:scale-110"
                  : "bg-gradient-to-br from-blue-500 to-cyan-400 group-hover:rotate-12"
              }`}
            >
              {isNightlife ? (
                <FaGlassMartiniAlt className="text-white text-sm" />
              ) : (
                <FaPlane className="text-white text-sm" />
              )}
            </div>
            <span
              className={`text-xl font-extrabold tracking-tight ${
                isNightlife
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              VN Lounge
              {isNightlife && (
                <span className="ml-1 text-[10px] text-purple-500 border border-purple-500 px-1 rounded align-top">
                  19+
                </span>
              )}
            </span>
          </Link>

          {/* 2. 메뉴 */}
          <nav className="hidden md:flex items-center gap-8">
            {isNightlife ? (
              <>
                <NavLink to="/adult/spots" className={navLinkClass}>
                  업소 정보
                </NavLink>
                <NavLink to="/adult/community" className={navLinkClass}>
                  커뮤니티
                </NavLink>
                <Link
                  to="/sponsor/info"
                  className="text-sm font-bold text-gray-400 hover:text-white transition-colors"
                >
                  제휴 문의
                </Link>
              </>
            ) : (
              <>
                <NavLink to="/spots" className={navLinkClass}>
                  추천 스팟
                </NavLink>
                <NavLink to="/plan" className={navLinkClass}>
                  여행 플랜
                </NavLink>
                <NavLink to="/events" className={navLinkClass}>
                  축제/이벤트
                </NavLink>
                <Link
                  to="/sponsor/info"
                  className="text-sm font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                >
                  광고문의
                </Link>
              </>
            )}
          </nav>

          {/* 3. 우측 컨트롤 */}
          <div className="hidden md:flex items-center gap-4">
            {/* 모드 스위처 */}
            <div
              className={`relative flex h-10 w-52 items-center rounded-full p-1 shadow-inner transition-colors duration-300 ${
                isNightlife
                  ? "bg-gray-800 border border-purple-900"
                  : "bg-gray-100 border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              }`}
            >
              {/* 슬라이딩 배경 */}
              <div
                className={`absolute h-8 w-[48%] rounded-full shadow-sm transition-all duration-300 ease-in-out ${
                  isNightlife
                    ? "left-[50%] bg-gradient-to-r from-purple-600 to-pink-600"
                    : "left-1 bg-white dark:bg-gray-600"
                }`}
              />

              <button
                onClick={handleDaylifeClick}
                className={`z-10 flex flex-1 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  !isNightlife ? "text-blue-600 dark:text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Explorer
              </button>

              <button
                onClick={handleNightlifeClick}
                className={`z-10 flex flex-1 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  isNightlife ? "text-white" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Nightlife
              </button>
            </div>

            {/* 다크모드 토글 (Nightlife 모드에서는 숨김) */}
            {!isNightlife && (
              <button
                onClick={() => setThemeMode(themeMode === "light" ? "dark" : "light")}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition"
                aria-label="다크모드 토글"
              >
                {themeMode === "dark" ? <FaSun className="text-yellow-400" /> : <FaMoon />}
              </button>
            )}

            <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700"></div>

            {/* 유저 메뉴 */}
            {isLoggedIn ? (
              <UserMenu />
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-bold text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition-colors"
                >
                  로그인
                </Link>
                <Link
                  to="/register"
                  className={`rounded-full px-5 py-2 text-sm font-bold text-white transition-all shadow-md hover:shadow-lg ${
                    isNightlife
                      ? "bg-white text-black hover:bg-gray-200"
                      : "bg-black hover:bg-gray-800 dark:bg-white dark:text-black"
                  }`}
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <button
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 md:hidden text-gray-800 dark:text-white"
          >
            {isMobileMenuOpen ? <HiOutlineX size={24} /> : <HiOutlineMenu size={24} />}
          </button>
        </div>

        {/* 모바일 메뉴 드롭다운 */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`overflow-hidden border-t md:hidden ${
                isNightlife
                  ? "bg-black/95 border-purple-900 text-white"
                  : "bg-white/95 border-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white"
              }`}
            >
              <div className="p-4 space-y-4">
                {isNightlife ? (
                  <>
                    <NavLink to="/adult/spots" className="block py-2 font-bold text-purple-400">
                      업소 정보
                    </NavLink>
                    <NavLink to="/adult/community" className="block py-2 font-bold text-gray-300">
                      커뮤니티
                    </NavLink>
                    <Link to="/sponsor/info" className="block py-2 font-bold text-gray-400">
                      제휴 문의
                    </Link>
                  </>
                ) : (
                  <>
                    <NavLink to="/spots" className="block py-2 font-bold text-blue-600">
                      추천 스팟
                    </NavLink>
                    <NavLink to="/plan" className="block py-2 font-bold text-gray-700 dark:text-gray-300">
                      여행 플랜
                    </NavLink>
                    <NavLink to="/events" className="block py-2 font-bold text-gray-700 dark:text-gray-300">
                      축제/이벤트
                    </NavLink>
                  </>
                )}

                {!isNightlife && (
                  <>
                    <hr className="border-gray-200 dark:border-gray-700" />
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium">테마 설정</span>
                      <button
                        onClick={() => setThemeMode(themeMode === "light" ? "dark" : "light")}
                        className="rounded-full p-2 bg-gray-100 dark:bg-gray-800"
                      >
                        {themeMode === "dark" ? <FaSun className="text-yellow-400" /> : <FaMoon />}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* AdultGate 모달 */}
      <AdultGate
        isOpen={isAdultGateOpen}
        onClose={() => setAdultGateOpen(false)}
        onPass={handleGatePass}
      />
    </>
  );
};

export default Header;
