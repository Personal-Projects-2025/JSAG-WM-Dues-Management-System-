/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        blob: 'blob 9s ease-in-out infinite',
        'blob-slow': 'blob 14s ease-in-out infinite',
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(28px, -36px) scale(1.06)' },
          '66%': { transform: 'translate(-22px, 22px) scale(0.94)' },
        },
      },
    },
  },
  plugins: [],
}

