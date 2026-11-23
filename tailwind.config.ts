import type { Config } from "tailwindcss";

/**
 * Wasil Oman — monochrome system
 * paper white, true black ink, a neutral grey ramp. Colour is reserved for status (sent/read/failed) only.
 * The old token names (brand, sand, ink, gold) are kept so every screen picks up the new look.
 */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F4F4F3",
        // "brand" is now the black action colour
        brand: {
          50: "#F2F2F2",
          100: "#E4E4E4",
          200: "#CACACA",
          300: "#E9E9E9",
          400: "#7A7A7A",
          500: "#2E2E2E",
          600: "#000000",
          700: "#2A2A2A",
          800: "#141414",
          900: "#000000",
        },
        sand: { 50: "#FAFAFA", 100: "#F1F1F0", 200: "#E3E3E2", 300: "#CFCFCD" },
        ink: { 300: "#A8A8A6", 400: "#80807E", 500: "#5E5E5C", 600: "#42423F", 700: "#2B2B29", 800: "#161616", 900: "#000000", 950: "#000000" },
        gold: { 50: "#F4F4F3", 100: "#E7E7E6", 400: "#FFFFFF", 500: "#D4D4D2", 600: "#3D3D3B" },
      },
      fontFamily: { sans: ["var(--font-latin)", "var(--font-arabic)", "system-ui", "sans-serif"] },
      fontSize: { "2xs": ["11px", "14px"] },
      boxShadow: {
        card: "0 0 0 1px rgba(0,0,0,0.02)",
        pop: "0 16px 40px -12px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.06)",
      },
      borderRadius: { xl: "0.75rem", "2xl": "1rem" },
    },
  },
  plugins: [],
} satisfies Config;
