import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
    const { theme, toggle } = useTheme();
    return (
        <button
            type="button"
            aria-label="toggle theme"
            onClick={toggle}
            className="inline-flex rounded-lg border border-border-subtle p-2 text-fg-muted hover:text-fg-body"
        >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
    );
}
