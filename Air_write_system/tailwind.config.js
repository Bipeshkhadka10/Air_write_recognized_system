/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./**/*.html",
    "./**/*.js",
    "./**/*.jsx",
  ],
  corePlugins: {
    preflight: false, //  This disables Tailwind's CSS reset
  },
  theme: {
    extend: {},
  },
  plugins: [],
}
