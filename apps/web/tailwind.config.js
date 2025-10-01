/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'Inter', 'Roboto', 'Noto Sans KR', 'sans-serif'],
      },
      colors: {
        // === Explorer Mode Colors (as per guide) ===
        'explorer-primary': '#2BB6C5', // CTA Primary (Mint)
        'explorer-primary-hover': '#26A3B2',
        'explorer-bg': '#FFFFFF', // Primary Background
        'explorer-bg-sub': '#F7FBFF', // Sub Background
        'explorer-text': '#1A1A1A', // Main Text
        'explorer-text-sub': '#6B7280', // Sub Text
        
        // === Nightlife Mode Colors (as per guide) ===
        'nightlife-primary': '#8B5CF6', // CTA Primary (Violet)
        'nightlife-primary-hover': '#7C3AED',
        'nightlife-bg': '#0E1526', // Primary Background
        'nightlife-bg-sub': '#121826', // Sub Background
        'nightlife-text': '#EAEAEA', // Main Text
        'nightlife-text-sub': '#9CA3AF', // Sub Text

        // === Tag Colors (as per guide) ===
        'tag-food': '#2BB6C5',
        'tag-culture': '#F97316',
        'tag-wellness': '#8B5CF6',
        'tag-nightlife': '#EC4899',

        // === Semantic Color Variables (to be populated by CSS) ===
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        background: 'var(--color-background)',
        'background-sub': 'var(--color-background-sub)',
        'text-main': 'var(--color-text-main)',
        'text-secondary': 'var(--color-text-secondary)',

        // ShadCN/UI compatibility layer
        border: 'var(--color-border)',
        input: 'var(--color-border)',
        ring: 'var(--color-primary)',
        foreground: 'var(--color-text-main)',
        surface: 'var(--color-background-sub)', // using sub-bg for surface
      },
      fontSize: {
        // As per Figma Style Guide
        'h1': ['40px', { lineHeight: '1.2', fontWeight: '700' }], // Bold
        'h2': ['30px', { lineHeight: '1.3', fontWeight: '600' }], // SemiBold
        'h3': ['19px', { lineHeight: '1.4', fontWeight: '600' }], // SemiBold
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }], // Regular
        'caption': ['13px', { lineHeight: '1.3', fontWeight: '500' }], // Medium
        'button': ['15px', { lineHeight: '1.4', fontWeight: '600' }], // SemiBold
      },
      scale: {
        '102': '1.02',
      },
      boxShadow: {
        'explorer': '0 4px 12px rgba(0,0,0,0.08)',
        'nightlife': '0 0 12px rgba(139,92,246,0.35)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        'card': '12px',
        'button': '12px',
      },
      transitionDuration: {
        '150': '150ms',
        '240': '240ms',
      },
      transitionTimingFunction: {
        'ease-in-out': 'ease-in-out',
      },
      transitionProperty: {
        'transform-shadow': 'transform, box-shadow',
      },
    },
  },
  plugins: [],
}
