/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep-space dark surfaces
        deep: {
          950: '#060B1F',
          900: '#0A1128',
          850: '#0D1530',
          800: '#10172A',
          750: '#141C36',
          700: '#1A2440',
          600: '#24304F'
        },
        // Brand: violet → indigo
        brand: {
          50: '#f3f3ff',
          100: '#e9e7ff',
          200: '#d6d1ff',
          300: '#b6adff',
          400: '#9485ff',
          500: '#7A6AF6',
          600: '#6D5EF5',
          700: '#5b47e8',
          800: '#4c39cf',
          900: '#3f31a8',
          950: '#261d66'
        },
        // Electric cyan accent
        accent: {
          50: '#ecfdff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#33dfff',
          500: '#00D1FF',
          600: '#00a9cf',
          700: '#0086a6',
          800: '#086c85',
          900: '#0b5a6e'
        },
        // Soft pink (secondary accent)
        orchid: {
          DEFAULT: '#A855F7',
          400: '#c084fc',
          500: '#A855F7',
          600: '#9333ea'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      fontSize: {
        'hero-xl': ['64px', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        hero: ['52px', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-2xl': ['36px', { lineHeight: '1.12', letterSpacing: '-0.02em' }],
        'display-xl': ['32px', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        section: ['24px', { lineHeight: '1.25', letterSpacing: '-0.015em' }]
      },
      borderRadius: {
        panel: '24px',
        'panel-lg': '28px',
        card: '20px',
        'card-sm': '16px'
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(2 8 23 / 0.05), 0 8px 24px -12px rgb(2 8 23 / 0.10)',
        'card-hover': '0 2px 4px 0 rgb(2 8 23 / 0.05), 0 20px 40px -18px rgb(2 8 23 / 0.18)',
        glow: '0 0 0 1px rgb(109 94 245 / 0.25), 0 12px 40px -8px rgb(109 94 245 / 0.45)',
        'glow-cyan': '0 0 0 1px rgb(0 209 255 / 0.2), 0 12px 40px -8px rgb(0 209 255 / 0.4)',
        'glow-soft': '0 0 24px -6px rgb(109 94 245 / 0.35)',
        glass: '0 8px 32px -12px rgb(2 8 23 / 0.12), inset 0 1px 0 rgb(255 255 255 / 0.06)',
        'inner-line': 'inset 0 1px 0 rgb(255 255 255 / 0.08)'
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6D5EF5 0%, #3B82F6 100%)',
        'gradient-cyan': 'linear-gradient(135deg, #00D1FF 0%, #A855F7 100%)',
        'gradient-orchid': 'linear-gradient(135deg, #A855F7 0%, #6D5EF5 100%)',
        'gradient-spring': 'linear-gradient(135deg, #22C55E 0%, #00D1FF 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
        'radial-fade': 'radial-gradient(circle, rgba(109,94,245,0.18) 0%, transparent 65%)'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' }
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '50%': { transform: 'translateY(-22px) translateX(12px)' }
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        aurora: {
          '0%, 100%': { opacity: '0.55', transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { opacity: '0.85', transform: 'translate3d(3%, -4%, 0) scale(1.06)' }
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' }
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' }
        },
        'marquee-x': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 6s ease infinite',
        shimmer: 'shimmer 2.2s linear infinite',
        aurora: 'aurora 12s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'spin-slow': 'spin-slow 1s linear infinite',
        'marquee-x': 'marquee-x 32s linear infinite'
      }
    }
  },
  plugins: []
};