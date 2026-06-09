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
        background: "#0B0B0B",
        foreground: "#FFFFFF",
        gold: {
          50: "#FDFBF7",
          100: "#FAF4E1",
          200: "#F0E2BA",
          300: "#E5C989",
          400: "#DBB15E",
          500: "#D4AF37", // Metallic gold primary
          600: "#B8942A",
          700: "#8C6D1F",
          800: "#604A15",
          900: "#3D2E0B",
        },
        dark: {
          DEFAULT: "#0B0B0B",
          surface: "#121212",
          card: "#161616",
          hover: "#222222",
          border: "#2A2A2A",
          muted: "#8A8A8A",
        }
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(212, 175, 55, 0.15)',
        'gold-glow-strong': '0 0 25px rgba(212, 175, 55, 0.3)',
      }
    },
  },
  plugins: [],
};
export default config;
