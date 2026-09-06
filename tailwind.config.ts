import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "opac-bg": "#F4F1EA",
        "opac-card": "#FFFFFF",
        "opac-green": "#2E7D4F",
        "opac-green-dark": "#0F3320",
        "opac-green-light": "#D4EAD9",
        "opac-gold": "#D4A017",
        "opac-gold-light": "#FDF4DC",
        "opac-ink": "#1A1A18",
        "opac-ink-60": "#5C5C58",
        "opac-ink-30": "#ADADAA",
        "opac-border": "#D8D2C6",
        "opac-surface": "#F2EFE8",
        "opac-success": "#22C55E",
        "opac-warning": "#F59E0B",
        "opac-error": "#EF4444",
        // Translucent surfaces — pair with backdrop-blur utilities
        glass: {
          DEFAULT: "rgba(255,255,255,0.58)",
          high: "rgba(255,255,255,0.78)",
          low: "rgba(255,255,255,0.42)",
          line: "rgba(255,255,255,0.68)",
          edge: "rgba(26,26,24,0.07)",
        },
      },
      fontFamily: {
        display: ["var(--font-dm-serif)", "serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,51,32,0.04), 0 8px 24px -8px rgba(15,51,32,0.12)",
        "card-lg":
          "0 2px 4px rgba(15,51,32,0.05), 0 18px 40px -12px rgba(15,51,32,0.20)",
        glass:
          "0 1px 2px rgba(15,51,32,0.04), 0 8px 24px -8px rgba(15,51,32,0.12), inset 0 1px 0 rgba(255,255,255,0.92)",
        dock: "0 8px 32px -8px rgba(15,51,32,0.28), inset 0 1px 0 rgba(255,255,255,0.9)",
        glow: "0 0 0 4px rgba(46,125,79,0.14)",
        "glow-gold": "0 0 0 4px rgba(212,160,23,0.16)",
      },
      maxWidth: {
        mobile: "390px",
      },
      borderRadius: {
        glass: "18px",
        pill: "999px",
      },
      backdropBlur: {
        glass: "22px",
        bar: "28px",
      },
      transitionTimingFunction: {
        glide: "cubic-bezier(0.22, 1, 0.36, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        rise: {
          from: { opacity: "0", transform: "translate3d(0,12px,0)" },
          to: { opacity: "1", transform: "translate3d(0,0,0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.94)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "drift-a": {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(6%,-8%,0) scale(1.12)" },
          "66%": { transform: "translate3d(-5%,5%,0) scale(0.94)" },
        },
        "drift-b": {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "40%": { transform: "translate3d(-8%,6%,0) scale(1.1)" },
          "75%": { transform: "translate3d(5%,-4%,0) scale(0.96)" },
        },
        "drift-c": {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1.04)" },
          "50%": { transform: "translate3d(4%,7%,0) scale(0.92)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.65" },
          "70%,100%": { transform: "scale(1.9)", opacity: "0" },
        },
      },
      animation: {
        rise: "rise 520ms cubic-bezier(0.22,1,0.36,1) both",
        "scale-in": "scale-in 280ms cubic-bezier(0.34,1.56,0.64,1) both",
        "drift-a": "drift-a 34s ease-in-out infinite",
        "drift-b": "drift-b 42s ease-in-out infinite",
        "drift-c": "drift-c 28s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.22,1,0.36,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
