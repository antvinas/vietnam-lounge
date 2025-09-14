import { FaSun, FaMoon, FaInstagram, FaTiktok } from 'react-icons/fa';
import useUiStore from '@/store/ui.store';

const ThemeToggle = () => {
  const { themeMode, setThemeMode } = useUiStore();
  const isDark = themeMode === 'dark';

  // The theme toggle is updated to use the new color system for better consistency.
  return (
    <div className="flex items-center p-1 rounded-full bg-surface">
      <button
        onClick={() => setThemeMode('light')}
        className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors flex items-center gap-1.5 ${!isDark ? 'bg-primary/80 text-white shadow-sm' : 'text-text-secondary'}`}
        aria-pressed={!isDark}
      >
        <FaSun/> Light
      </button>
      <button
        onClick={() => setThemeMode('dark')}
        className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors flex items-center gap-1.5 ${isDark ? 'bg-primary/80 text-white shadow-sm' : 'text-text-secondary'}`}
        aria-pressed={isDark}
      >
        <FaMoon/> Dark
      </button>
    </div>
  );
};

const Footer = () => {
  return (
    // The footer now uses semantic colors from our new theme system.
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          
          <div className="text-center md:text-left">
            <p className="text-md font-semibold text-text-main">&copy; {new Date().getFullYear()} Vietnam Lounge</p>
            <p className="text-sm text-text-secondary mt-1">Your ultimate guide to the best of Vietnam, day and night.</p>
            {/* Trust-building message as requested in the feedback */}
            <p className="text-xs text-text-secondary/70 mt-3">모든 정보는 현지 기반으로 검증된 콘텐츠입니다.</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <ThemeToggle />
            {/* Social media icons for brand enhancement */}
            <div className="flex items-center space-x-4">
                <a href="#" className="text-text-secondary hover:text-primary transition-colors text-2xl"><FaInstagram /></a>
                <a href="#" className="text-text-secondary hover:text-primary transition-colors text-2xl"><FaTiktok /></a>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
