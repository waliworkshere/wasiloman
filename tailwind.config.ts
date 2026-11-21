import type { Config } from "tailwindcss";

/**
 * Wasil Oman design tokens
 * petrol ink (sidebar, headings) · cool grey-green canvas · Omani emerald for action/data · frankincense amber for highlights only
 */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F3F5F4",
        brand: {
          50: "#ECF7F2",
          100: "#D2EDE2",
          200: "#A6DBC5",
          300: "#6EC3A2",
          400: "#2FA57D",
          500: "#14906A",
          600: "#0B7A5C",
          700: "#09634B",
          800: "#0A4F3D",
          900: "#083F31",
        },
        sand: { 50: "#F8FAF9", 100: "#EEF2F0", 200: "#E3E8E6", 300: "#CCD5D2" },
        ink: { 300: "#A3AFAD", 400: "#7C8A88", 500: "#56656A", 600: "#3B4B51", 700: "#26363C", 800: "#15262E", 900: "#0E1B22", 950: "#0A151B" },
        gold: { 50: "#FDF6E8", 100: "#FAE9C6", 400: "#E2A33B", 500: "#C98A22", 600: "#9C6712" },
      },
      fontFamily: { sans: ["var(--font-latin)", "var(--font-arabic)", "system-ui", "sans-serif"] },
      fontSize: { "2xs": ["11px", "14px"] },
      boxShadow: {
        card: "0 1px 0 rgba(14,27,34,0.03), 0 1px 3px rgba(14,27,34,0.04)",
        pop: "0 12px 32px -8px rgba(14,27,34,0.18), 0 2px 6px rgba(14,27,34,0.06)",
      },
      borderRadius: { xl: "0.8rem", "2xl": "1rem" },
    },
  },
  plugins: [],
} satisfies Config;
