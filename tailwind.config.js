/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f7',
          100: '#dbf0ec',
          200: '#b9e1da',
          300: '#8eccc2',
          400: '#61b3a7',
          500: '#7A9A95', // Main brand color
          600: '#3a7c6f',
          700: '#30655a',
          800: '#285349',
          900: '#24453e',
          950: '#112621',
        },
        secondary: {
          50: '#fdf4f3',
          100: '#fce7e4',
          200: '#f9d3ce',
          300: '#f4b5ab',
          400: '#ec8b7a',
          500: '#e36858', // Coral accent
          600: '#d04732',
          700: '#b03828',
          800: '#923326',
          900: '#7a2f25',
          950: '#42160f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}