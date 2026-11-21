/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      '2xs': '320px',
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'md-sm': '850px',
      'lg': '1024px',
      'xl': '1280px',
      'xl-lg': '1440px',
      '2xl': '1536px',
      '2xl-md': '1680px',
      '2xl-lg': '1920px',
      '3xl': '2560px',
    },
    extend: {
      fontFamily: {
        heading: [
          'var(--font-heading)',
          '"Space Grotesk"',
          'system-ui',
          'sans-serif'
        ],
        sans: [
          'var(--font-body)',
          '"Plus Jakarta Sans"',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          'var(--font-mono)',
          '"IBM Plex Mono"',
          'monospace'
        ]
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
