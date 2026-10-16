/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./data/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0B1220",
          light: "#111A2E",
          lighter: "#182338",
          border: "#1E2A45",
        },
        brand: {
          blue: "#2563EB",
          amber: "#F59E0B",
        },
      },
    },
  },
  plugins: [],
};
