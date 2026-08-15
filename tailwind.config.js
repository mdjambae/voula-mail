/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0005E6',
          dark: '#0004C2',
        },
        primary: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          50: '#EEF0FF',
          100: '#E0E3FF',
          200: '#C6CBFF',
          300: '#A5ABFF',
          400: '#8B8AFB',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#372FA0',
          900: '#2D2A7D',
        },
        ink: {
          950: '#07070C',
          900: '#0B0B14',
          850: '#0F0F1A',
          800: '#13131F',
          700: '#1A1A29',
          600: '#242438',
          500: '#33334D',
          400: '#4A4A68',
        },
        mist: {
          50: '#F8F8FC',
          100: '#EFEFF7',
          200: '#D9D9E8',
          300: '#B6B6CC',
          400: '#8B8BA5',
        },
        success: {
          DEFAULT: '#22C55E',
          soft: '#16351F',
        },
        warning: {
          DEFAULT: '#F5A524',
          soft: '#3A2C10',
        },
        danger: {
          DEFAULT: '#F1445C',
          soft: '#3A1420',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(99,102,241,0.15), 0 8px 40px -8px rgba(99,102,241,0.45)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 24px 48px -24px rgba(0,0,0,0.55)',
        soft: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'hero-halo':
          'radial-gradient(60% 60% at 50% 30%, rgba(99,102,241,0.35) 0%, rgba(99,102,241,0.12) 35%, rgba(7,7,12,0) 70%)',
        'grid-fade':
          'linear-gradient(to bottom, rgba(7,7,12,0) 0%, rgba(7,7,12,1) 100%)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.55 },
          '50%': { opacity: 0.9 },
        },
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(14px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        typeIn: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        floatSlow: 'floatSlow 6s ease-in-out infinite',
        pulseGlow: 'pulseGlow 4s ease-in-out infinite',
        fadeUp: 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        scanline: 'scanline 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};
