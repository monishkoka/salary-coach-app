/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand accent — deep teal/green: money, growth, calm.
        brand: {
          50: '#E6F6F0',
          100: '#C2E9D9',
          200: '#8FD6BB',
          300: '#54BE98',
          400: '#2BA67E',
          500: '#0E8C6A',
          600: '#0A7257',
          700: '#085A45',
          800: '#064334',
          900: '#042C22',
        },
        // Neutral base scale used for surfaces/text in both themes.
        ink: {
          DEFAULT: '#0B0B0F',
          50: '#F7F7F5',
          100: '#ECECEA',
          200: '#D6D6D3',
          300: '#B3B3AF',
          400: '#86868B',
          500: '#5A5A60',
          600: '#3A3A40',
          700: '#26262B',
          800: '#17171B',
          900: '#0B0B0F',
        },
        positive: '#1FB57A',
        caution: '#E8A33D',
        risk: '#E5645B',
      },
      borderRadius: {
        card: '24px',
        pill: '999px',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
