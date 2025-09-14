/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === Raw Color Tokens ===
        'explorer-primary': '#2BB6C5',
        'explorer-secondary': '#2F80ED',
        'explorer-accent': '#00C2A8',
        'explorer-bg': '#F7FBFF',
        'explorer-surface': '#FFFFFF',
        'explorer-text': '#0B1726',

        'nightlife-primary': '#8B5CF6',
        'nightlife-accent': '#FF61D8',
        'nightlife-bg': '#0E1526',
        'nightlife-surface': '#121826',
        'nightlife-elevated': '#1B2337',
        'nightlife-text': '#E6E9F2',
        'nightlife-text-secondary': '#A9B4C7',

        // === Semantic Color Variables ===
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        elevated: 'var(--color-elevated)',
        'text-main': 'var(--color-text-main)',
        'text-secondary': 'var(--color-text-secondary)',

        // ShadCN/UI compatibility layer
        border: 'var(--color-border)',
        input: 'var(--color-border)',
        ring: 'var(--color-primary)',
        foreground: 'var(--color-text-main)',
      },
      scale: {
        '102': '1.02',
      },
      fontSize: {
        'h1': ['clamp(2.5rem, 5vw, 3.75rem)', { lineHeight: '1.1', fontWeight: '800' }],
        'h2': ['clamp(1.75rem, 4vw, 2.5rem)', { lineHeight: '1.2', fontWeight: '700' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'caption': ['0.875rem', { lineHeight: '1.4' }],
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '240': '240ms',
        '320': '320ms',
      },
      transitionTimingFunction: {
        'material-decel': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        'material-accel': 'cubic-bezier(0.4, 0.0, 1, 1)',
      },
      transitionProperty: {
        'transform-shadow': 'transform, box-shadow',
      },
      boxShadow: {
        'lifted': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        'subtle': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
