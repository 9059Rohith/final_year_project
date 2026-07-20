import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          50: "#FFF8F0",
          100: "#FEECD8",
          200: "#FDD9B0",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          800: "#9A3412",
          900: "#7C2D12",
        },
        accent: {
          purple: "#7C3AED",
          "purple-light": "#A78BFA",
          green: "#059669",
          "green-light": "#34D399",
          blue: "#2563EB",
          "blue-light": "#60A5FA",
        },
        calm: {
          bg: "#FFFBF5",
          card: "#FFF8F0",
          border: "#FEECD8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        tamil: ["Noto Sans Tamil", "sans-serif"],
      },
      animation: {
        "bounce-slow": "bounce 2s infinite",
        "pulse-warm": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "celebrate": "celebrate 0.6s ease-out",
        "wiggle": "wiggle 0.5s ease-in-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        celebrate: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2) rotate(5deg)" },
          "100%": { transform: "scale(1) rotate(0deg)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-5deg)" },
          "75%": { transform: "rotate(5deg)" },
        },
      },
      boxShadow: {
        warm: "0 4px 24px rgba(249, 115, 22, 0.15)",
        "warm-lg": "0 8px 40px rgba(249, 115, 22, 0.2)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
