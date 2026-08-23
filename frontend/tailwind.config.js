/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sprout: {
          50: "#f1f8ec",
          100: "#dcedcd",
          200: "#bcdc9f",
          300: "#95c56a",
          400: "#72ab43",
          500: "#548f28",
          600: "#40721d",
          700: "#33581a",
          800: "#2b471a",
          900: "#253c19",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          "Inter",
          '"Segoe UI"',
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
