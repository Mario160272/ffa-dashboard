/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ffa: {
          red: '#C9002B',
          darkred: '#500515',
          sidebar: '#1A0008',
          bluegray: '#BCC8D4',
          gold: '#917845',
          text: '#202020',
          bg: '#F5F5F5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
