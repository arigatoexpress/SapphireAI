/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sapphire: {
          50: '#f4f9ff',
          100: '#dcecff',
          200: '#b1d0ff',
          300: '#83b3ff',
          400: '#4a8cff',
          500: '#2563eb',
          600: '#1d4fd7',
          700: '#1b43ac',
          800: '#1b3a86',
          900: '#162c63',
        },
        surface: {
          25: '#0b111f',
          50: '#0f172a',
          75: '#101c31',
          100: '#111f34',
          200: '#14263f',
          300: '#182d4f',
          400: '#1d3863',
        },
        accent: {
          ai: '#22d3ee',
          emerald: '#34d399',
          aurora: '#a855f7',
          amber: '#f59e0b',
        },
        security: {
          shield: '#38bdf8',
          fortress: '#0ea5e9',
          guardian: '#1d4ed8',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        neutral: '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['"Neue Haas Grotesk"', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        glass: '0 25px 55px -25px rgba(4, 16, 40, 0.65)',
        'glass-xl': '0 35px 120px -35px rgba(13, 42, 88, 0.55)',
      },
      backdropBlur: {
        xs: '2px',
        md: '12px',
        lg: '24px',
      },
      letterSpacing: {
        mega: '.35em',
        ultra: '.45em',
      },
      spacing: {
        18: '4.5rem',
        26: '6.5rem',
        30: '7.5rem',
      },
      borderRadius: {
        '4xl': '2.5rem',
      },
      animation: {
        pulseShield: 'pulseShield 3s ease-in-out infinite',
      },
      keyframes: {
        pulseShield: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(56, 189, 248, 0.45)' },
          '50%': { boxShadow: '0 0 0 18px rgba(56, 189, 248, 0)' },
        },
      },
    },
  },
  plugins: [],
};
