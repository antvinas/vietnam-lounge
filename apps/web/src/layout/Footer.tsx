import { FaSun, FaMoon, FaInstagram, FaTiktok } from "react-icons/fa";
import useUiStore from "@/store/ui.store";

const Footer = () => {
  const { themeMode, setThemeMode } = useUiStore();
  const isDark = themeMode === "dark";

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto flex max-w-screen-xl flex-col items-center justify-between gap-6 px-4 py-8 md:flex-row md:px-10 lg:px-20">
        {/* Left: Brand Info */}
        <div className="text-center md:text-left">
          <p className="text-md font-semibold text-text-main">
            &copy; {new Date().getFullYear()} Vietnam Lounge
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Your ultimate guide to the best of Vietnam, day and night.
          </p>
          <p className="mt-3 text-xs text-text-secondary/70">
            모든 정보는 현지 기반으로 검증된 콘텐츠입니다.
          </p>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-col items-center gap-4">
          {/* Theme Toggle */}
          <div className="flex items-center rounded-full bg-surface p-1">
            <button
              onClick={() => setThemeMode("light")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                !isDark
                  ? "bg-primary/80 text-white shadow-sm"
                  : "text-text-secondary"
              }`}
            >
              <FaSun /> Light
            </button>
            <button
              onClick={() => setThemeMode("dark")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                isDark
                  ? "bg-primary/80 text-white shadow-sm"
                  : "text-text-secondary"
              }`}
            >
              <FaMoon /> Dark
            </button>
          </div>

          {/* Social Media */}
          <div className="flex items-center space-x-4">
            <a
              href="#"
              className="text-2xl text-text-secondary hover:text-primary"
            >
              <FaInstagram />
            </a>
            <a
              href="#"
              className="text-2xl text-text-secondary hover:text-primary"
            >
              <FaTiktok />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
