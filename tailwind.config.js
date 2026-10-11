/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./*.html"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#00363d',
          primary: '#007382',
          light: '#e6f7ec',
          gold: '#c59b27'
        }
      }
    },
  },
  plugins: [],
}
