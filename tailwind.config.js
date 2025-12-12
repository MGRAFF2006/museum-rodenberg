/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Lexend', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Primary palette - Museum brand colors
        primary: {
          50: '#f0f4f8',
          100: '#d9e2ed',
          200: '#b3c5db',
          300: '#8ca8c9',
          400: '#6690ba',
          500: '#4a77ab',
          600: '#3a5c8f',
          700: '#2a4373',
          800: '#1a2a57',
          900: '#0f1a38',
        },
        // Secondary accent - Gold/warm tones
        accent: {
          50: '#fef9f0',
          100: '#fce8d1',
          200: '#f9d7a3',
          300: '#f5c675',
          400: '#f2b547',
          500: '#dfa234',
          600: '#c8871e',
          700: '#9e6b18',
          800: '#744f12',
          900: '#4a330c',
        },
        // Neutral palette
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
  plugins: [],
};
