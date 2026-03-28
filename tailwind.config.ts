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
        "opac-bg": "#F8F6F1",
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
      },
      fontFamily: {
        display: ["var(--font-dm-serif)", "serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 4px 16px rgba(0,0,0,0.08)",
        "card-lg": "0 8px 32px rgba(0,0,0,0.12)",
      },
      maxWidth: {
        mobile: "390px",
      },
    },
  },
  plugins: [],
};

export default config;
