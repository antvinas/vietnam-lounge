import { FaSun, FaMoon, FaInstagram, FaTiktok } from "react-icons/fa";
import useUiStore from "@/store/ui.store";
import { Link } from "react-router-dom";

const cities = ["하노이", "다낭", "호치민", "푸꾸옥", "하롱베이", "닌빈", "호이안"];

const Footer = () => {
  const { themeMode, setThemeMode } = useUiStore();
  const isDark = themeMode === "dark";

  return (
    <footer className="border-t border-border bg-footer-light dark:bg-footer-dark text-footer-text transition-colors duration-500 mt-auto">
      <div className="mx-auto flex max-w-screen-xl flex-col items-center justify-between gap-8 px-4 py-10 md:flex-row md:px-10 lg:px-20">
        <div>
          <h3 className="text-lg font-bold text-text-main">베트남 라운지</h3>
          <p className="text-sm text-text-secondary mt-1">Explore Vietnam — Day & Night</p>
          <p className="text-xs text-text-tertiary mt-2">© {new Date().getFullYear()} All rights reserved.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 text-sm text-text-secondary">
          {cities.map((city) => (
            <Link
              key={city}
              to={`/spots?city=${encodeURIComponent(city)}`}
              className="hover:text-primary transition-colors"
            >
              {city}
            </Link>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center rounded-full border border-border bg-background dark:bg-surface p-1">
            <button
              onClick={() => setThemeMode("light")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold transition-all duration-300 ${
                !isDark ? "bg-primary text-white" : "text-text-secondary"
              }`}
            >
              <FaSun /> Light
            </button>
            <button
              onClick={() => setThemeMode("dark")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold transition-all duration-300 ${
                isDark ? "bg-primary text-white" : "text-text-secondary"
              }`}
            >
              <FaMoon /> Dark
            </button>
          </div>
          <div className="flex items-center space-x-4 text-2xl text-text-secondary">
            <a href="#" className="hover:text-primary transition-colors">
              <FaInstagram />
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              <FaTiktok />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
