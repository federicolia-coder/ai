import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        tarry: {
          50: "#f5f7fa",
          100: "#ebeef3",
          200: "#d2d9e5",
          300: "#aab8ce",
          400: "#7c92b2",
          500: "#5b7499",
          600: "#475d80",
          700: "#3a4c68",
          800: "#334157",
          900: "#2e394a",
          950: "#1e2531",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
