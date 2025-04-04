/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Main app colors
        'background': '#121418',
        'dark': '#1A1D23',
        'dark-light': '#282C34',
        'card-bg': '#1F2329',
        
        // Brand colors
        'primary': '#5A7DFB',
        'primary-dark': '#4A69DF',
        'btn-primary': '#5A7DFB',
        'btn-secondary': '#282C34',
        
        // Status colors
        'success': '#40C057',
        'success-dark': '#2B9942',
        'warning': '#FD7E14',
        'warning-dark': '#E86400',
        'error': '#FA5252',
        'error-dark': '#E03131',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
} 