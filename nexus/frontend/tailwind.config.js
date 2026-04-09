/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e8f0fa",
          100: "#c5d9f2",
          200: "#9fbfe8",
          300: "#78a5de",
          400: "#5a91d6",
          500: "#1A56A4",
          600: "#174d93",
          700: "#133f7a",
          800: "#0f3161",
          900: "#0a2248",
        },
      },
    },
  },
  plugins: [],
};
