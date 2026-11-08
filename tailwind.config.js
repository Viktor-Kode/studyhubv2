/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic design tokens linked to CSS variables
        background: 'var(--bg, #F8FAFC)',
        foreground: 'var(--text-primary, #0F172A)',
        surface: {
          DEFAULT: 'var(--surface, #FFFFFF)',
          2: 'var(--surface-2, #F1F5F9)',
        },
        card: {
          DEFAULT: 'var(--surface, #FFFFFF)',
          foreground: 'var(--text-primary, #0F172A)',
        },
        popover: {
          DEFAULT: 'var(--surface, #FFFFFF)',
          foreground: 'var(--text-primary, #0F172A)',
        },
        muted: {
          DEFAULT: 'var(--surface-2, #F1F5F9)',
          foreground: 'var(--text-muted, #64748B)',
        },
        border: 'var(--border, #E2E8F0)',
        ring: 'var(--purple, #4F46E5)',

        // Primary: Refined, calming academic indigo (replaces harsh neon #5B4CF5)
        primary: {
          DEFAULT: 'var(--primary, #4F46E5)',
          foreground: 'var(--primary-foreground, #FFFFFF)',
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },

        // Calm academic indigo scale
        indigo: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },

        // Refined violet / purple scale
        purple: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#2E1065',
        },
        violet: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#EDE9FE',
          300: '#DDD6FE',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#2E1065',
        },

        // Sophisticated slate blue scale
        blue: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },

        // Soft, desaturated neutrals for dark/light mode
        gray: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#0F172A',
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#0F172A',
        },
        zinc: {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
          950: '#0F172A',
        },
      },
      animation: {
        blob: 'blob 7s infinite',
        gradient: 'gradient 3s ease infinite',
        backgroundMove: 'backgroundMove 20s linear infinite',
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
        backgroundMove: {
          '0%': {
            'background-position': '0 0',
          },
          '100%': {
            'background-position': '60px 60px',
          },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            p: { overflowWrap: 'anywhere', wordBreak: 'break-word' },
            pre: { whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflowX: 'auto' },
            code: { wordBreak: 'break-all' },
            'ul, ol': { width: '100%', overflow: 'hidden' },
            li: { overflowWrap: 'anywhere', wordBreak: 'break-word' },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
