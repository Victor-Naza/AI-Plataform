/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#1C1C1C',
          surface: '#242424',
          border: '#2E2E2E',
          text: '#F5F5F5',
          muted: '#A1A1AA',
          icon: '#E5E7EB',
          disabled: '#3F3F46',
          overlay: 'rgba(0, 0, 0, 0.5)',
        },
        brand: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
        },
        assistant: '#16A34A',
        danger: '#F87171',
      },
    },
  },
  plugins: [],
};
