import type { Config } from "tailwindcss";
import { DESIGN_BORDER, DESIGN_COLORS, DESIGN_RADIUS, DESIGN_SHADOW } from "@tebak-kata/shared";

// Design System v2.0 (Neo-Brutalism) — tokens sourced from the shared
// package so overlay/host/admin never drift. See PLAN_Redesign_Neo_Brutalism.md §4.
const hardShadow = (px: number) => `${px}px ${px}px 0 0 ${DESIGN_COLORS.ink}`;
const bounce = "cubic-bezier(.34,1.56,.64,1)";

const config: Config = {
  // `relative: true` resolves the globs against this file, not the process cwd,
  // so builds started from the monorepo root still generate every class.
  content: {
    relative: true,
    files: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./games/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  },
  theme: {
    extend: {
      colors: {
        ink: DESIGN_COLORS.ink,
        paper: DESIGN_COLORS.paper,
        "paper-deep": DESIGN_COLORS.paperDeep,
        muted: DESIGN_COLORS.muted,
        yellow: DESIGN_COLORS.yellow,
        pink: DESIGN_COLORS.pink,
        blue: DESIGN_COLORS.blue,
        green: DESIGN_COLORS.green,
        orange: DESIGN_COLORS.orange,
        red: DESIGN_COLORS.red,
        purple: DESIGN_COLORS.purple,
      },
      fontFamily: {
        display: ["var(--font-display)", '"Archivo Black"', "sans-serif"],
        ui: ["var(--font-ui)", '"Space Grotesk"', "sans-serif"],
        mono: ["var(--font-mono)", '"Space Mono"', "monospace"],
      },
      borderWidth: {
        3: `${DESIGN_BORDER.base}px`,
        5: `${DESIGN_BORDER.thick}px`,
        6: `${DESIGN_BORDER.heavy}px`,
      },
      borderRadius: {
        "nb-sm": `${DESIGN_RADIUS.small}px`,
        nb: `${DESIGN_RADIUS.card}px`,
      },
      boxShadow: {
        "nb-sm": hardShadow(DESIGN_SHADOW.sm),
        "nb-md": hardShadow(DESIGN_SHADOW.md),
        "nb-lg": hardShadow(DESIGN_SHADOW.lg),
        "nb-xl": hardShadow(DESIGN_SHADOW.xl),
        "nb-2xl": hardShadow(DESIGN_SHADOW.xxl),
      },
      keyframes: {
        "flip-pop": {
          "0%": { transform: "scaleY(0.1)" },
          "60%": { transform: "scaleY(1.12)" },
          "100%": { transform: "scaleY(1)" },
        },
        "tile-flash": {
          "0%, 45%": { backgroundColor: DESIGN_COLORS.yellow },
          "100%": { backgroundColor: DESIGN_COLORS.white },
        },
        "drop-in": {
          "0%": { transform: "translateY(-140%)", opacity: "0" },
          "70%": { transform: "translateY(6%)", opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "70%": { transform: "scale(1.06)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        stamp: {
          "0%": { transform: "scale(2.4) rotate(-16deg)", opacity: "0" },
          "60%": { transform: "scale(0.9) rotate(-6deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-8deg)", opacity: "1" },
        },
        wiggle: {
          "0%, 84%, 100%": { transform: "rotate(0deg)" },
          "88%": { transform: "rotate(-2deg)" },
          "92%": { transform: "rotate(2deg)" },
          "96%": { transform: "rotate(-1deg)" },
        },
        shake: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "20%": { transform: "translate(-10px, 4px)" },
          "40%": { transform: "translate(8px, -6px)" },
          "60%": { transform: "translate(-6px, 6px)" },
          "80%": { transform: "translate(4px, -2px)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(130%) rotate(8deg)" },
          "70%": { transform: "translateX(-4%) rotate(-3deg)" },
          "100%": { transform: "translateX(0) rotate(-2deg)" },
        },
        "hazard-scroll": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "67.88px 0" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
      animation: {
        "flip-pop": `flip-pop 260ms ${bounce} both`,
        "tile-reveal": `flip-pop 260ms ${bounce} both, tile-flash 900ms ease-out both`,
        "drop-in": `drop-in 520ms ${bounce} both`,
        "pop-in": `pop-in 260ms ${bounce} both`,
        stamp: `stamp 420ms ${bounce} both`,
        wiggle: "wiggle 3s ease-in-out infinite",
        shake: "shake 420ms ease-out both",
        "slide-in-right": `slide-in-right 480ms ${bounce} both`,
        "hazard-scroll": "hazard-scroll 1s linear infinite",
        blink: "blink 1s steps(1, end) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
