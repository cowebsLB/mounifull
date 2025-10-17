/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./pages/**/*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        olive: "#556b2f",
        terracotta: "#c96a3d",
        beige: "#f5f1e6"
      },
      fontFamily: {
        cormorant: ["Cormorant Garamond", "serif"],
        lato: ["Lato", "sans-serif"]
      }
    }
  },
  plugins: []
};

