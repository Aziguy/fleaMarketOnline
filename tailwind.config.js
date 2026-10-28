/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./templates/**/*.html", "./apps/**/templates/**/*.html", "./apps/**/forms.py", "./static/js/app.js"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#effcf3",
          100: "#d9f7e3",
          200: "#b4eec8",
          300: "#7fdfa4",
          400: "#45c77a",
          500: "#1fab5b",
          600: "#138a43",
          700: "#116d39",
          800: "#125630",
          900: "#10472a",
          950: "#052816",
        },
        sun: {
          100: "#fff4cc",
          400: "#fbc531",
          500: "#f5b301",
          600: "#d99a00",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(16 71 42 / 0.06), 0 4px 16px rgb(16 71 42 / 0.06)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
