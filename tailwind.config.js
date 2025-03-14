/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Add line-clamp to extend if needed (since line-clamp is now in core)
      lineClamp: {
        7: '7',
        8: '8',
        9: '9',
        10: '10',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    // Line-clamp plugin is now part of Tailwind core, so we remove it
  ],
}
