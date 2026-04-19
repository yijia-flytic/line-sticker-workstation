/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        coral: { 50:'#FFF5F3', 100:'#FFE8E3', 200:'#FFD4CC', 300:'#FFB3A3', 400:'#FF8E71', 500:'#FF6B6B', 600:'#E84545', 700:'#C23030', 800:'#9E2525', 900:'#7A1E1E' },
        peach: { 50:'#FFF8F0', 100:'#FFF0E0', 200:'#FFE0C2', 300:'#FFC999', 400:'#FFB06B', 500:'#FF8E53', 600:'#E06B2E', 700:'#B84D1A', 800:'#93400D', 900:'#7A350A' },
      },
      fontFamily: {
        display: ['"M PLUS Rounded 1c"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
