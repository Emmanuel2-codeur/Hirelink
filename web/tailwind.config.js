/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        yale: { DEFAULT: '#284B63', 700: '#1F3B4F', 800: '#193044', 900: '#12222F' },  // identité, navigation
        teal: { DEFAULT: '#3C6E71', 600: '#2F5759', 100: '#D5E6E6', 50: '#EAF2F2' },    // actions, IA
        mint: { DEFAULT: '#7DD3B8', 600: '#4FB99A' },                                   // accent sur fonds sombres uniquement
        ink: '#1B2A35',                // titres
        graphite: { DEFAULT: '#353535', 900: '#1B2A35' },
        muted: '#5B6670',              // texte secondaire : 5,9:1 sur blanc, 5,4:1 sur alabaster (AA)
        line: '#D5DBE0',               // bordures
        alabaster: { DEFAULT: '#F5F7F8', 200: '#D9DEE2' },
        success: { DEFAULT: '#166534', 50: '#ECFDF3' },
        warning: { DEFAULT: '#92400E', 50: '#FFFBEB' },
        danger: { DEFAULT: '#B91C1C', 50: '#FEF2F2', 700: '#991B1B' },
      },
      fontFamily: {
        sans: ['"Inter Variable"', '"Noto Sans Arabic"', 'system-ui', 'sans-serif'],
        arabic: ['"Noto Sans Arabic"', '"Inter Variable"', 'sans-serif'],
      },
      boxShadow: {                    // échelle d'élévation unique
        card: '0 1px 2px rgb(27 42 53 / 0.06), 0 1px 3px rgb(27 42 53 / 0.04)',
        pop: '0 12px 32px -8px rgb(27 42 53 / 0.25)',
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.25rem' },
    },
  },
  plugins: [],
};
