import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // True bordeaux / wine palette — no pink
        bordeaux: {
          50: "#faf6f7",
          100: "#f2e8ea",
          200: "#e6d1d6",
          300: "#d1adb5",
          400: "#b5808c",
          500: "#9a5e6b",
          600: "#834556",
          700: "#6b3345",
          800: "#5a2c3b",
          900: "#4d2734",
          950: "#2a1019",
        },
      },
    },
  },
  plugins: [],
};
export default config;
