import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9ecff",
          200: "#bcdfff",
          300: "#8ecbff",
          400: "#59afff",
          500: "#3192ff",
          600: "#1d74f0",
          700: "#175dd3",
          800: "#194ea8",
          900: "#1a4584"
        },
        mint: {
          50: "#effbf6",
          100: "#d8f5e7",
          200: "#b3ebd2",
          300: "#82dbb6",
          400: "#52c697",
          500: "#2fae7c",
          600: "#208c63",
          700: "#1b7050",
          800: "#185942",
          900: "#154936"
        },
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5dae2",
          300: "#b1b9c8",
          400: "#8691a6",
          500: "#65728a",
          600: "#505b71",
          700: "#414a5b",
          800: "#373e4c",
          900: "#1f2530"
        }
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        soft: "0 4px 24px -8px rgba(15,23,42,0.08)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial"]
      }
    }
  },
  plugins: []
};
export default config;
