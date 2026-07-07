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
        mckinsey: {
          navy: "#051C2C",
          blue: "#2251FF",
          "blue-muted": "#3D5AFE",
          slate: "#4A5568",
          mist: "#F4F6F8",
          border: "#E2E8F0",
          success: "#0D7C4E",
          warning: "#B45309",
          danger: "#B42318",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(5, 28, 44, 0.06), 0 8px 24px rgba(5, 28, 44, 0.04)",
        elevated: "0 4px 12px rgba(5, 28, 44, 0.08), 0 24px 48px rgba(5, 28, 44, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
