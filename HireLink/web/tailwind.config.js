/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        yale: { DEFAULT: '#284B63', 700: '#1f3b4f', 900: '#16293a' },   // navigation & identité
        teal: { DEFAULT: '#3C6E71', 600: '#325d60', 50: '#eaf2f2' },      // actions & IA
        graphite: { DEFAULT: '#353535', 900: '#0B0B0B' },                 // textes
        alabaster: { DEFAULT: '#F7F7F7', 200: '#D9D9D9' },                // fonds & cartes
      },
      fontFamily: {
        sans: ['"Inter Variable"', '"Noto Sans Arabic"', 'system-ui', 'sans-serif'],
        arabic: ['"Noto Sans Arabic"', '"Inter Variable"', 'sans-serif'],
      },
      borderRadius: { xl: '0.9rem' },
    },
  },
  plugins: [],
};
