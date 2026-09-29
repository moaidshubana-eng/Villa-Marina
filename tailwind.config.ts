import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff",
          100: "#d9eaff",
          200: "#bcdaff",
          300: "#8ec2ff",
          400: "#59a2ff",
          500: "#2f7dff",
          600: "#195ff2",
          700: "#144bd6",
          800: "#173fac",
          900: "#183a87",
        },
      },
      fontFamily: {
        arabic: ["Tahoma", "Segoe UI", "Cairo", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
