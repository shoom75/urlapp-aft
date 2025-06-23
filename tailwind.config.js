/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",          // プロジェクト直下のHTMLファイル
    "./src/**/*.{js,jsx,ts,tsx}"  // srcフォルダ内のJS/TS/JSX/TSXファイルをスキャン
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
