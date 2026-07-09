import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "rgb(var(--bg-base) / <alpha-value>)",
        surface: "rgb(var(--bg-surface) / <alpha-value>)",
        elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
        muted: "rgb(var(--bg-muted) / <alpha-value>)",
        primary: "rgb(var(--text-primary) / <alpha-value>)",
        secondary: "rgb(var(--text-muted) / <alpha-value>)",
        inverse: "rgb(var(--text-inverse) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-muted": "rgb(var(--accent-muted) / <alpha-value>)",
        gold: "rgb(var(--accent-gold) / <alpha-value>)",
        "gold-dark": "rgb(var(--accent-gold-dark) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        "border-strong": "rgb(var(--border-strong) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        brand: {
          navy: "rgb(var(--text-primary) / <alpha-value>)",
          blue: "rgb(var(--accent) / <alpha-value>)",
          slate: "rgb(var(--text-muted) / <alpha-value>)",
          mist: "rgb(var(--bg-muted) / <alpha-value>)",
          border: "rgb(var(--border) / <alpha-value>)",
          success: "rgb(var(--success) / <alpha-value>)",
          warning: "rgb(var(--warning) / <alpha-value>)",
          danger: "rgb(var(--danger) / <alpha-value>)",
          gold: "rgb(var(--accent-gold) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgb(var(--text-primary) / 0.04), 0 8px 24px rgb(var(--text-primary) / 0.03)",
        elevated: "0 4px 12px rgb(var(--text-primary) / 0.06), 0 24px 48px rgb(var(--text-primary) / 0.04)",
        surface: "0 1px 2px rgb(var(--text-primary) / 0.05), 0 4px 16px rgb(var(--text-primary) / 0.04)",
        glow: "0 0 0 1px rgb(var(--accent) / 0.1), 0 8px 32px rgb(var(--accent) / 0.12)",
        "glow-gold": "0 0 0 1px rgb(var(--accent-gold) / 0.2), 0 8px 32px rgb(var(--accent-gold) / 0.1)",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "250ms",
        slow: "400ms",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        in: "cubic-bezier(0.4, 0, 1, 1)",
      },
      animation: {
        shimmer: "shimmer 1.5s ease-in-out infinite",
        "pulse-soft": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
