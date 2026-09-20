import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e5ff",
          200: "#bcd1ff",
          300: "#8eb4ff",
          400: "#598cff",
          500: "#3366ff",
          600: "#1f47f5",
          700: "#1a36e1",
          800: "#1c2fb6",
          900: "#1d2e8f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
