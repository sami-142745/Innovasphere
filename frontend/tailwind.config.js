/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep-space dark surfaces
        deep: {
          950: '#06081F',
          900: '#0A0E2E',
          850: '#0D1438',
          800: '#111A44',
          750: '#162250',
          700: '#1C2A5E',
          600: '#273A76'
        },
        // Brand: violet
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#7c3aed',
          600: '#6d28d9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b1578',
          950: '#2e1065'
        },
        // Hot pink accent
        accent: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724'
        },
        // Cyan secondary
        orchid: {
          DEFAULT: '#06b6d4',
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344'
        },
        status: {
          open: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
            950: '#022c22'
          },
          'in-progress': {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
            950: '#451a03'
          },
          completed: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
            950: '#172554'
          },
          rejected: {
            50: '#fff1f2',
            100: '#ffe4e6',
            200: '#fecdd3',
            300: '#fda4af',
            400: '#fb7185',
            500: '#f43f5e',
            600: '#e11d48',
            700: '#be123c',
            800: '#9f1239',
            900: '#881337',
            950: '#4c0519'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif']
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
        glow: '0 0 0 1px rgb(124 58 237 / 0.25), 0 12px 40px -8px rgb(124 58 237 / 0.45)',
        'glow-cyan': '0 0 0 1px rgb(6 182 212 / 0.2), 0 12px 40px -8px rgb(6 182 212 / 0.4)',
        'glow-soft': '0 0 24px -6px rgb(124 58 237 / 0.35)',
        glass: '0 8px 32px -12px rgb(2 8 23 / 0.12), inset 0 1px 0 rgb(255 255 255 / 0.06)',
        'inner-line': 'inset 0 1px 0 rgb(255 255 255 / 0.08)'
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
        'gradient-primary': 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 52%, #06B6D4 100%)',
        'gradient-accent': 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
        'gradient-cyan': 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
        'gradient-orchid': 'linear-gradient(135deg, #EC4899 0%, #7C3AED 100%)',
        'gradient-spring': 'linear-gradient(135deg, #22C55E 0%, #06B6D4 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #F59E0B 0%, #F43F5E 100%)',
        'radial-fade': 'radial-gradient(circle, rgba(124,58,237,0.20) 0%, transparent 65%)'
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