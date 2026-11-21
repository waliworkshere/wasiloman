import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EEF7F5",
          100: "#D5ECE7",
          200: "#A9D8CE",
          300: "#73BEAF",
          400: "#3F9F8D",
          500: "#1F8573",
          600: "#136B5D",
          700: "#0F564B",
          800: "#0D453D",
          900: "#0A3530",
        },
        sand: { 50: "#FBF9F4", 100: "#F5F1E7", 200: "#EAE2CF", 300: "#D9CBA8" },
        gold: { 400: "#D4AF5A", 500: "#B8923A", 600: "#94732B" },
        ink: { 400: "#7A8580", 500: "#55605B", 700: "#2B3330", 900: "#121816" },
      },
      fontFamily: { sans: ["var(--font-plex)", "system-ui", "sans-serif"] },
      boxShadow: { card: "0 1px 2px rgba(18,24,22,.04), 0 4px 16px rgba(18,24,22,.05)" },
    },
  },
  plugins: [],
} satisfies Config;
