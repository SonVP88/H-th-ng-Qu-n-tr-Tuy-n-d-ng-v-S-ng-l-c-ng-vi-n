/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class', 
  theme: {
    extend: {
      colors: {
        "primary": "#135bec",
        "primary-hover": "#0e4bce",
        "background-light": "#f6f6f8",
        "background-dark": "#101622",
        "card-light": "#ffffff",
        "card-dark": "#1a222e",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"]
      },
    },
  },
  plugins: [],
}