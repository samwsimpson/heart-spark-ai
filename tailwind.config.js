/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media',
  content: [
    "./app/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx,js,jsx,mdx}",
    "./pages/**/*.{ts,tsx,js,jsx,mdx}"
  ],
  theme: {
    extend: {
      borderRadius: { xl: "0.75rem", '2xl': "1rem" }
    },
  },
  plugins: [],
};
