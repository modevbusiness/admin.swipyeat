import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx,js,jsx}',
    './src/components/**/*.{ts,tsx,js,jsx}',
    './app/**/*.{ts,tsx,js,jsx}',
    './pages/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f17900',
        'primary-dark': '#feb700',
        secondary: '#FF4D00',
        'bg-light': '#fdfcfd',
        'bg-dark': '#272a22',
        'surface-light': '#ffffff',
        'surface-dark': '#32362b',
        'border-light': '#e1e7da',
        'text-primary': '#151810',
        'text-secondary': '#FF6B2B'
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'sans-serif']
      }
    }
  },
  plugins: []
}

export default config
