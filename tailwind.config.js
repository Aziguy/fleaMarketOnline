/** @type {import('tailwindcss').Config} */
const shades = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const themed = (name, keys = shades) =>
  Object.fromEntries(keys.map((s) => [s, `rgb(var(--${name}-${s}) / <alpha-value>)`]));

module.exports = {
  content: ["./templates/**/*.html", "./apps/**/templates/**/*.html", "./apps/**/forms.py", "./static/js/*.js"],
  darkMode: [
    "variant",
    ['@media (prefers-color-scheme: dark) { &:not(:where([data-theme="light"], [data-theme="light"] *)) }', '&:where([data-theme="dark"], [data-theme="dark"] *)'],
  ],
  theme: {
    extend: {
      colors: {
        brand: themed("brand"),
        stone: themed("stone"),
        red: themed("red"),
        amber: themed("amber"),
        sky: themed("sky"),
        sun: themed("sun", ["100", "400", "500", "600"]),
        surface: { DEFAULT: "rgb(var(--surface) / <alpha-value>)", 2: "rgb(var(--surface-2) / <alpha-value>)" },
        night: {
          50: "#ecfdf3",
          100: "#d1fae4",
          200: "#a7f3c9",
          300: "#6ee7a8",
          400: "#3fd685",
          500: "#1fab5b",
          600: "#138a43",
          700: "#0d5c32",
          800: "#0a3d23",
          900: "#072718",
          950: "#03150c",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Space Grotesk", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(16 71 42 / 0.18)",
        glow: "0 0 0 1px rgb(var(--brand-400) / 0.25), 0 8px 30px -6px rgb(var(--brand-500) / 0.55)",
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "none" } },
        aurora: { "0%,100%": { transform: "translate(0,0) scale(1)" }, "50%": { transform: "translate(4%,-6%) scale(1.08)" } },
        shimmer: { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
        "pop-in": { from: { opacity: "0", transform: "scale(.96)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        "fade-up": "fade-up .6s cubic-bezier(.2,.7,.2,1) both",
        aurora: "aurora 18s ease-in-out infinite",
        shimmer: "shimmer 1.6s linear infinite",
        "pop-in": "pop-in .18s ease-out both",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
