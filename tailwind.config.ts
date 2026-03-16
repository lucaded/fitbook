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
        bordeaux: {
          50: "#fdf2f4",
          100: "#fce7eb",
          200: "#f9d0d9",
          300: "#f4a9b9",
          400: "#ec7793",
          500: "#df4a6e",
          600: "#c9295a",
          700: "#a91d49",
          800: "#8d1b40",
          900: "#7a1b3e",
          950: "#440a1e",
        },
        primary: {
          50: "#fdf2f4",
          100: "#fce7eb",
          200: "#f9d0d9",
          300: "#f4a9b9",
          400: "#ec7793",
          500: "#df4a6e",
          600: "#c9295a",
          700: "#a91d49",
          800: "#8d1b40",
          900: "#7a1b3e",
        },
      },
    },
  },
  plugins: [],
};
export default config;
