import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaPlane, FaSun, FaMoon } from 'react-icons/fa';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import useThemeStore from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';

const Header = () => {
  const { mode, toggleMode } = useThemeStore();
  const { isLoggedIn, user, logout } = useAuthStore();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isNight = mode === 'night';

  const linkStyle = "block px-3 py-2 rounded-md text-base font-medium transition-colors";
  const activeLinkStyle = isNight ? "bg-purple-600 text-white" : "bg-blue-600 text-white";
  const inactiveLinkStyle = isNight ? "text-gray-300 hover:bg-gray-700 hover:text-white" : "text-gray-700 hover:bg-gray-200 hover:text-gray-900";
  const headerBg = isNight ? "bg-gray-800 shadow-lg" : "bg-white shadow-md";
  const logoColor = isNight ? "text-purple-400" : "text-blue-600";
  const toggleButtonColor = isNight ? "text-yellow-400" : "text-gray-600";

  const navLinkClass = ({ isActive }: { isActive: boolean }) => `${linkStyle} ${isActive ? activeLinkStyle : inactiveLinkStyle}`;

  const navLinks = (
    <>
      <NavLink to={isNight ? '/adult/spots' : '/spots'} className={navLinkClass}>
        스팟<span className="text-xs ml-1">{isNight ? '(Spot)' : '(Explore)'}</span>
      </NavLink>
      <NavLink to={isNight ? '/adult/plan' : '/plan'} className={navLinkClass}>
        플랜<span className="text-xs ml-1">{isNight ? '(Plan)' : '(Journey)'}</span>
      </NavLink>
      <NavLink to={isNight ? '/adult/community' : '/community'} className={navLinkClass}>
        커뮤니티<span className="text-xs ml-1">(Lounge)</span>
      </NavLink>
      <NavLink to={isNight ? '/adult/events' : '/events'} className={navLinkClass}>
        이벤트<span className="text-xs ml-1">(Event)</span>
      </NavLink>
    </>
  );

  return (
    <header className={`sticky top-0 z-50 transition-colors duration-300 ${headerBg}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <FaPlane className={`text-2xl ${logoColor}`} />
            <span className={`text-xl font-bold ${isNight ? 'text-white' : 'text-gray-800'}`}>
              베트남 라운지
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks}
          </div>

          <div className="flex items-center">
            <button
              onClick={toggleMode}
              className={`p-2 rounded-full focus:outline-none focus:ring-2 ${toggleButtonColor}`}
              aria-label="Toggle theme"
            >
              {isNight ? <FaSun /> : <FaMoon />}
            </button>

            <div className="hidden md:flex items-center ml-3">
              {isLoggedIn ? (
                <>
                  <NavLink to="/mypage" className={navLinkClass}>마이페이지</NavLink>
                  {user?.role === 'admin' && <NavLink to="/admin" className={navLinkClass}>관리자</NavLink>}
                  <button onClick={logout} className={`${linkStyle} ${inactiveLinkStyle}`}>로그아웃</button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className={navLinkClass}>로그인</NavLink>
                  <NavLink to="/register" className={navLinkClass}>회원가입</NavLink>
                </>
              )}
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700">
                {isMobileMenuOpen ? <HiOutlineX size={24} /> : <HiOutlineMenu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks}
            <div className="border-t border-gray-700 pt-4 mt-4">
              {isLoggedIn ? (
                <>
                  <NavLink to="/mypage" className={navLinkClass}>마이페이지</NavLink>
                  {user?.role === 'admin' && <NavLink to="/admin" className={navLinkClass}>관리자</NavLink>}
                  <button onClick={logout} className={`${linkStyle} ${inactiveLinkStyle} w-full text-left`}>로그아웃</button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className={navLinkClass}>로그인</NavLink>
                  <NavLink to="/register" className={navLinkClass}>회원가입</NavLink>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
