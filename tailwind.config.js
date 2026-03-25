/** @type {import('tailwindcss').Config} */
// Refreshing config to resolve styling issues
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
        /* Palette remap rules:
         * - All blue/indigo/purple/violet shades -> primary (#5B4CF5)
         * - gray/slate/zinc: 50 -> background (#F7F8FA), 900 -> secondary (#0F172A)
         * - Other neutrals remain grey-ish values (no extra accent colors introduced)
         */
        primary: {
          50: '#5B4CF5',
          100: '#5B4CF5',
          200: '#5B4CF5',
          300: '#5B4CF5',
          400: '#5B4CF5',
          500: '#5B4CF5',
          600: '#5B4CF5',
          700: '#5B4CF5',
          800: '#5B4CF5',
          900: '#5B4CF5',
          950: '#5B4CF5',
        },
        blue: {
          50: '#5B4CF5',
          100: '#5B4CF5',
          200: '#5B4CF5',
          300: '#5B4CF5',
          400: '#5B4CF5',
          500: '#5B4CF5',
          600: '#5B4CF5',
          700: '#5B4CF5',
          800: '#5B4CF5',
          900: '#5B4CF5',
          950: '#5B4CF5',
        },
        indigo: {
          50: '#5B4CF5',
          100: '#5B4CF5',
          200: '#5B4CF5',
          300: '#5B4CF5',
          400: '#5B4CF5',
          500: '#5B4CF5',
          600: '#5B4CF5',
          700: '#5B4CF5',
          800: '#5B4CF5',
          900: '#5B4CF5',
          950: '#5B4CF5',
        },
        purple: {
          50: '#5B4CF5',
          100: '#5B4CF5',
          200: '#5B4CF5',
          300: '#5B4CF5',
          400: '#5B4CF5',
          500: '#5B4CF5',
          600: '#5B4CF5',
          700: '#5B4CF5',
          800: '#5B4CF5',
          900: '#5B4CF5',
          950: '#5B4CF5',
        },
        violet: {
          50: '#5B4CF5',
          100: '#5B4CF5',
          200: '#5B4CF5',
          300: '#5B4CF5',
          400: '#5B4CF5',
          500: '#5B4CF5',
          600: '#5B4CF5',
          700: '#5B4CF5',
          800: '#5B4CF5',
          900: '#5B4CF5',
          950: '#5B4CF5',
        },
        gray: {
          50: '#F7F8FA',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#0F172A',
          950: '#0F172A',
        },
        slate: {
          50: '#F7F8FA',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#0F172A',
          950: '#0F172A',
        },
        zinc: {
          50: '#F7F8FA',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#0F172A',
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
    },
  },
  plugins: [],
}
