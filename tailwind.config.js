/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond Variable', 'Georgia', 'serif'],
        sans: ['Lexend Variable', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Primary palette - Museum brand colors (Sophisticated Navy)
        primary: {
          50: '#f4f6fb',
          100: '#e8ecf7',
          200: '#d1d9ef',
          300: '#b9c6e7',
          400: '#8ba1d7',
          500: '#5d7bc7',
          600: '#546fb3',
          700: '#465c95',
          800: '#384a77',
          900: '#2e3c61',
        },
        // Secondary accent - Gold/warm tones (Elegant Amber)
        accent: {
          50: '#fffbf2',
          100: '#fef3d9',
          200: '#fde4a3',
          300: '#fbd46d',
          400: '#f9c537',
          500: '#f7b500',
          600: '#e5a700',
          700: '#9d7300',
          800: '#765600',
          900: '#4d3800',
        },
        // Neutral palette - Refined Stone
        neutral: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29d',
          500: '#78716b',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },
      },
      spacing: {
        'section': '3rem',
        'section-lg': '4rem',
      },
      padding: {
        'section': '3rem',
        'section-lg': '4rem',
      },
      fontSize: {
        // Typography scale
        'display-lg': ['3rem', { lineHeight: '3.5rem', letterSpacing: '-0.02em' }],
        'display': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.01em' }],
        'heading-xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.01em' }],
        'heading-lg': ['1.5rem', { lineHeight: '1.75rem' }],
        'heading': ['1.25rem', { lineHeight: '1.5rem' }],
        'heading-sm': ['1.125rem', { lineHeight: '1.35rem' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.5rem' }],
        'body': ['1rem', { lineHeight: '1.5rem' }],
        'body-sm': ['0.9375rem', { lineHeight: '1.4rem' }],
        'caption': ['0.875rem', { lineHeight: '1.35rem' }],
        'caption-sm': ['0.8125rem', { lineHeight: '1.25rem' }],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'md-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'lg-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'xl-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      borderRadius: {
        'sm': '0.375rem',
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
