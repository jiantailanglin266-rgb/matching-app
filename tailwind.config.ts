import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class", // <html class="dark"> で切り替え
  theme: {
    extend: {
      colors: {
        // ブランドカラー（適宜変更してください）
        brand: {
          DEFAULT: "#ff5a7e",
          dark: "#e23e63",
        },
      },
    },
  },
  plugins: [],
};

export default config;
