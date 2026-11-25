/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F8FAFC',
        surface: '#FFFFFF',
        subtle: '#F1F5F9',
        ink: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#64748B'
        },
        brand: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          tint: '#EFF6FF'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: []
};
