/**
 * VN Lounge Global Theme System
 * Color system unified with Tailwind tokens (BX standard)
 */
export const theme = {
  colors: {
    /** Brand Core */
    primary: "#2BB6C5",
    primaryDark: "#26A3B2",
    secondary: "#8B5CF6",
    secondaryDark: "#7C3AED",

    /** Background Layers */
    background: "#FFFFFF",
    backgroundSub: "#F8FAFC",
    surface: "#FFFFFF",
    border: "#E2E8F0",

    /** Text */
    textMain: "#1E293B",
    textSecondary: "#64748B",
    textTertiary: "#94A3B8",

    /** State */
    success: "#10B981",
    warning: "#FACC15",
    error: "#EF4444",
  },

  darkColors: {
    background: "#0F172A",
    backgroundSub: "#111827",
    surface: "#1E293B",
    border: "#334155",
    textMain: "#F8FAFC",
    textSecondary: "#CBD5E1",
    textTertiary: "#64748B",
    primary: "#22D3EE",
    secondary: "#C084FC",
  },

  gradients: {
    primary: "linear-gradient(135deg, #2BB6C5 0%, #26A3B2 100%)",
    secondary: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
    darkPrimary: "linear-gradient(135deg, #22D3EE 0%, #0891B2 100%)",
    darkSecondary: "linear-gradient(135deg, #C084FC 0%, #9333EA 100%)",
  },

  shadows: {
    card: "0 6px 16px rgba(0,0,0,0.08)",
    hover: "0 8px 24px rgba(0,0,0,0.12)",
    depth: "0 12px 28px rgba(0,0,0,0.15)",
  },

  radius: {
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    full: "9999px",
  },

  transitions: {
    fast: "all 0.15s ease-in-out",
    normal: "all 0.25s ease-in-out",
    slow: "all 0.4s ease",
  },

  fonts: {
    heading:
      "'Pretendard Variable', 'Noto Sans KR', system-ui, -apple-system, sans-serif",
    body:
      "'Pretendard Variable', 'Noto Sans KR', system-ui, -apple-system, sans-serif",
  },
};

export default theme;
