import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: "var(--surface)",
        border: "var(--border)",
        muted: "var(--muted)",
        accent: "var(--accent)",
      },
      fontFamily: {
        sans: [
          "Meiryo UI",
          "メイリオ",
          "Meiryo",
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "Yu Gothic UI",
          "Yu Gothic",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
