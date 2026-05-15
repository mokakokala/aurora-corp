/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'aurora-bg': '#080808',
        'aurora-border': '#1f1f1f',
        'aurora-orange': '#f97316',
      },
      fontFamily: {
        terminal: ['"Courier New"', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
}

