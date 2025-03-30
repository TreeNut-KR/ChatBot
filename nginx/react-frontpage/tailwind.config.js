/** @type {import('tailwindcss').Config} */
module.exports = {
  // 빌드 과정에서 사용되는 모든 파일 포함
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // 개발 환경에서는 모든 스타일 유지
  safelist: process.env.NODE_ENV === 'development' ? [{ pattern: /.*/ }] : [],
}

