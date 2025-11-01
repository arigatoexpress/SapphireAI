/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#e6ebff',
          200: '#c3ccff',
          300: '#9fafff',
          400: '#7387ff',
          500: '#4c63ff',
          600: '#3246e6',
          700: '#2434b4',
          800: '#1d2a8c',
          900: '#18236d',
        },
        surface: {
          50: '#0f172a',
          100: '#111c33',
          200: '#13213d',
          300: '#16274b',
          400: '#1a315f',
        },
        accent: {
          teal: '#22d3ee',
          emerald: '#34d399',
          amber: '#f59e0b',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        neutral: '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        glass: '0 20px 45px -20px rgba(15, 23, 42, 0.55)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

