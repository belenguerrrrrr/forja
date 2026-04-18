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
        forja: {
          bg:           '#F5F5F2',
          surface:      '#FFFFFF',
          text:         '#0E1015',
          muted:        '#6B6B6F',
          faint:        '#9B9BA0',
          hairline:     'rgba(14, 16, 21, 0.08)',
          softFill:     '#EFEFEA',
          primary:      '#0F7A3A',
          'primary-hover': '#0a5c2b',
          primaryDim:   '#DDECE2',
          accent:       '#B8621B',
          chartGrid:    'rgba(14, 16, 21, 0.06)',
          tabBarBg:     'rgba(245, 245, 242, 0.92)',
          // aliases kept for backward compat
          border:       'rgba(14, 16, 21, 0.08)',
          secondary:    '#0F7A3A',
          green:        '#0F7A3A',
        },
      },
      fontFamily: {
        display: ['var(--font-bebas)', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
