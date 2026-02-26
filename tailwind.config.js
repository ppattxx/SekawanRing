/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "plant-green": "#0D986A",
        "plant-light": "#E6F4EE",
        "plant-dark": "#002140",
      },
      fontFamily: {
        "sans": ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
}