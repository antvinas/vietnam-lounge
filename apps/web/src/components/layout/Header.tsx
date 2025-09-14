import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaPlane, FaSun, FaMoon } from 'react-icons/fa';
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';
import useUiStore from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { useStore as useAdultStore } from '@/store/adult.store';
import AdultGate from '../common/AdultGate';

// Component for switching between Explorer and Nightlife modes
const ContentModeToggle = () => {
  const { contentMode, setContentMode } = useUiStore();
  const { isAgeVerified, setVerificationStatus } = useAdultStore();
  const [isAdultGateOpen, setAdultGateOpen] = useState(false);
  const isNightlife = contentMode === 'nightlife';

  const handleNightlifeClick = () => {
    const preference = localStorage.getItem('adult_gate_preference');
    if (isAgeVerified || preference === 'hide') {
      setVerificationStatus(true);
      setContentMode('nightlife');
    } else {
      setAdultGateOpen(true);
    }
  };

  const handleVerificationSuccess = () => {
    setVerificationStatus(true);
    setContentMode('nightlife');
    setAdultGateOpen(false);
  };

  const activeClass = "bg-surface text-text-main shadow-subtle";
  const inactiveClass = "text-text-secondary";

  return (
    <>
      <div className="flex items-center p-1 rounded-full bg-background">
        <button
          onClick={() => setContentMode('explorer')}
          className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors flex items-center gap-1.5 ${!isNightlife ? activeClass : inactiveClass}`}
          aria-pressed={!isNightlife}
        >
          Explorer 🌍
        </button>
        <button
          onClick={handleNightlifeClick}
          className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors flex items-center gap-1.5 ${isNightlife ? activeClass : inactiveClass}`}
          aria-pressed={isNightlife}
        >
          Nightlife 🌙
        </button>
      </div>
      {isAdultGateOpen && (
        <AdultGate
          onSuccess={handleVerificationSuccess}
          onCancel={() => setAdultGateOpen(false)}
        />
      )}
    </>
  );
};

// New Component for switching between Light and Dark themes
const ThemeModeToggle = () => {
  const { themeMode, setThemeMode } = useUiStore();

  const toggleTheme = () => {
    setThemeMode(themeMode === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full text-text-secondary hover:bg-surface hover:shadow-subtle transition-all"
      aria-label="Toggle theme"
    >
      {themeMode === 'light' ? <FaMoon size={18} /> : <FaSun size={18} className="text-yellow-400" />}
    </button>
  );
};

const Header = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoggedIn, user, logout } = useAuthStore();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary text-white' // This will now use the correct primary color for each mode
        : 'text-text-secondary hover:bg-surface hover:text-text-main'
    }`;

  const authLinkClass = "px-3 py-2 rounded-md text-sm font-medium transition-colors text-text-secondary hover:bg-surface hover:text-text-main";

  const mainNavLinks = (
    <>
      <NavLink to={"/spots"} className={navLinkClass}>스팟</NavLink>
      <NavLink to={"/plan"} className={navLinkClass}>플랜</NavLink>
      <NavLink to={"/community"} className={navLinkClass}>라운지</NavLink>
      <NavLink to={"/events"} className={navLinkClass}>이벤트</NavLink>
    </>
  );

  const authNavLinks = isLoggedIn ? (
    <>
      <NavLink to="/mypage" className={authLinkClass}>마이페이지</NavLink>
      {user?.role === 'admin' && <NavLink to="/admin" className={authLinkClass}>관리자</NavLink>}
      <button onClick={logout} className={`${authLinkClass} text-left w-full`}>로그아웃</button>
    </>
  ) : (
    <>
      <NavLink to="/login" className={authLinkClass}>로그인</NavLink>
      <NavLink to="/register" className={authLinkClass}>회원가입</NavLink>
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-surface shadow-subtle transition-colors duration-320">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <FaPlane className="text-2xl text-primary" />
              <span className="text-xl font-bold text-text-main">베트남 라운지</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-1 ml-6">
              {mainNavLinks}
            </nav>
          </div>
          <div className="flex items-center space-x-2">
            <div className="hidden md:flex items-center space-x-2 bg-background p-1 rounded-full">
              <ContentModeToggle />
              <ThemeModeToggle />
            </div>
            <div className="hidden md:flex items-center ml-2">{authNavLinks}</div>
            <div className="md:hidden flex items-center">
               <ThemeModeToggle />
              <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md text-text-secondary">
                {isMobileMenuOpen ? <HiOutlineX size={24} /> : <HiOutlineMenu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden bg-surface">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
             <div className="p-2 flex justify-center">
                <div className="bg-background p-1 rounded-full">
                    <ContentModeToggle />
                </div>
            </div>
            <nav className="flex flex-col space-y-1">{mainNavLinks}</nav>
            <div className="border-t border-border pt-4 mt-4">
              <div className="flex flex-col space-y-1">{authNavLinks}</div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
