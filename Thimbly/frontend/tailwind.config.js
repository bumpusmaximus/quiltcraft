/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cottage: {
          sage: "#4A5D4E",
          cream: "#F9F7F2",
          sand: "#D9C5A0",
          clay: "#8C5E58",
          wood: "#5D4037",
          moss: "#2D3A30",
        },
        primary: {
          DEFAULT: "#4A5D4E",
          foreground: "#F9F7F2",
        },
        secondary: {
          DEFAULT: "#D9C5A0",
          foreground: "#5D4037",
        },
      },
      fontFamily: {
        serif: ["'Playfair Display'", "serif"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
