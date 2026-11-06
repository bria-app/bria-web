import type { Config } from "tailwindcss";

// Colors are CSS variables (RGB channel triplets) defined in globals.css, so `data-mode`
// on <html> swaps light/dark at runtime. `<alpha-value>` keeps opacity modifiers (bg-primary/20).
const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: v("--c-bg"),
        surface: v("--c-surface"),
        "surface-soft": v("--c-surface-soft"),
        "surface-muted": v("--c-surface-muted"),
        border: v("--c-border"),
        "border-soft": v("--c-border-soft"),

        primary: {
          DEFAULT: v("--c-primary"),
          hover: v("--c-primary-hover"),
          soft: v("--c-primary-soft"),
          softer: v("--c-primary-softer"),
        },
        "on-primary": v("--c-on-primary"),

        text: {
          primary: v("--c-text"),
          secondary: v("--c-text-secondary"),
          muted: v("--c-text-muted"),
        },

        strong: { DEFAULT: v("--c-strong"), foreground: v("--c-on-strong") },
        "accent-text": v("--c-accent-text"),
        "accent-on-strong": v("--c-accent-on-strong"),
        "accent-line": v("--c-accent-line"),
        brand: v("--c-brand"),

        success: { DEFAULT: v("--c-success"), soft: v("--c-success-soft") },
        warning: { DEFAULT: v("--c-warning"), soft: v("--c-warning-soft") },
        danger: { DEFAULT: v("--c-danger"), soft: v("--c-danger-soft") },
        info: { DEFAULT: v("--c-info"), soft: v("--c-info-soft") },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        // Controls 12px, cards 16px, sheets 20-24px.
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(var(--shadow-color) / 0.04), 0 4px 18px -8px rgb(var(--shadow-color) / 0.07)",
        "soft-lg": "0 2px 6px -2px rgb(var(--shadow-color) / 0.06), 0 16px 36px -14px rgb(var(--shadow-color) / 0.14)",
        "soft-xl": "0 4px 12px -4px rgb(var(--shadow-color) / 0.08), 0 32px 64px -24px rgb(var(--shadow-color) / 0.26)",
      },
    },
  },
  plugins: [],
};
export default config;
