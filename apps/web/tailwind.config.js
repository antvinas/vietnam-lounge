/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      container: { center: true, padding: "1rem" },
      fontFamily: {
        sans: ["Pretendard", "Inter", "Roboto", "Noto Sans KR", "sans-serif"],
      },
      colors: {
        /* Light / Dark variable references */
        background: "rgb(var(--color-bg) / <alpha-value>)",
        "background-sub": "rgb(var(--color-bg-sub) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        "text-main": "rgb(var(--color-text-main) / <alpha-value>)",
        "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
        "text-tertiary": "rgb(var(--color-text-tertiary) / <alpha-value>)",

        primary: "rgb(var(--color-primary) / <alpha-value>)",
        "primary-dark": "rgb(var(--color-primary-dark) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        "secondary-dark": "rgb(var(--color-secondary-dark) / <alpha-value>)",

        success: "rgb(var(--color-success) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        error: "rgb(var(--color-error) / <alpha-value>)",
      },

      boxShadow: {
        card: "0 6px 16px rgba(0,0,0,0.08)",
        hover: "0 8px 24px rgba(0,0,0,0.12)",
        depth: "0 12px 28px rgba(0,0,0,0.15)",
      },

      borderRadius: {
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        full: "9999px",
      },

      transitionDuration: {
        fast: "150ms",
        normal: "250ms",
        "240": "240ms",
      },
      transitionProperty: {
        "transform-shadow": "transform, box-shadow",
      },
      scale: { 102: "1.02" },
    },
  },
  plugins: [],
};
