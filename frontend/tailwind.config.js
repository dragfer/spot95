/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        retro: ["'Press Start 2P'", 'monospace'],
      },
      boxShadow: {
        window: '8px 8px 0 0 #000',
      },
    },
    
  },
  plugins: [],
};
