// src/layout/Footer.tsx
import { FaSun, FaMoon, FaInstagram, FaTiktok, FaFacebook, FaYoutube } from "react-icons/fa";
import useUiStore from "@/store/ui.store";
import { Link } from "react-router-dom";

const cities = ["하노이", "다낭", "호치민", "푸꾸옥", "하롱베이", "닌빈", "호이안"];

const Footer = () => {
  const { themeMode, setThemeMode } = useUiStore();
  const isDark = themeMode === "dark";

  return (
    <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-[#0B1120] transition-colors duration-300">
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-10 lg:px-20">
        
        {/* 상단: 로고 및 주요 링크 그리드 */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
          
          {/* 1. 브랜드 정보 */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
              베트남 라운지
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              낮에는 힐링, 밤에는 킬링.<br/>
              베트남의 다채로운 매력을 발견하세요.<br/>
              Travel & Nightlife Guide
            </p>
          </div>

          {/* 2. 빠른 이동 (내비게이션) */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-200">
              메뉴
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link to="/spots" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">추천 스팟</Link></li>
              <li><Link to="/plan" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">여행 플랜</Link></li>
              <li><Link to="/events" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">이벤트 & 쿠폰</Link></li>
              <li><Link to="/sponsor/info" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">광고/제휴 문의</Link></li>
            </ul>
          </div>

          {/* 3. 인기 여행지 (도시 필터 링크) */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-200">
              인기 여행지
            </h4>
            {/* 2열 그리드로 깔끔하게 배치 */}
            <ul className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
              {cities.map((city) => (
                <li key={city}>
                  <Link
                    to={`/spots?city=${encodeURIComponent(city)}`}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors block py-0.5"
                  >
                    {city}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. 소셜 & 설정 */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-200">
              Follow Us
            </h4>
            <div className="flex space-x-4 mb-6">
              <a href="#" aria-label="Instagram" className="text-gray-500 hover:text-pink-600 transition-colors transform hover:scale-110">
                <FaInstagram size={20} />
              </a>
              <a href="#" aria-label="TikTok" className="text-gray-500 hover:text-black dark:hover:text-white transition-colors transform hover:scale-110">
                <FaTiktok size={20} />
              </a>
              <a href="#" aria-label="Facebook" className="text-gray-500 hover:text-blue-600 transition-colors transform hover:scale-110">
                <FaFacebook size={20} />
              </a>
              <a href="#" aria-label="Youtube" className="text-gray-500 hover:text-red-600 transition-colors transform hover:scale-110">
                <FaYoutube size={20} />
              </a>
            </div>

            {/* 테마 토글 버튼 (가독성 개선) */}
            <button
              onClick={() => setThemeMode(isDark ? "light" : "dark")}
              className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              {isDark ? <FaSun className="text-amber-400" /> : <FaMoon className="text-indigo-600" />}
              {isDark ? "라이트 모드로 보기" : "다크 모드로 보기"}
            </button>
          </div>
        </div>

        {/* 하단: 저작권 및 법적 고지 */}
        <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              &copy; {new Date().getFullYear()} Vietnam Lounge. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-gray-500 dark:text-gray-500">
              <Link to="#" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">이용약관</Link>
              <Link to="#" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">개인정보처리방침</Link>
              <Link to="#" className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">사업자 정보</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;