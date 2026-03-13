import type { Config } from 'tailwindcss'

export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './app.vue'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      colors: {
        base: '#08091a',
        surface: '#0e1326',
        elevated: '#141929',
        border: '#1f2d47',
        accent: {
          DEFAULT: '#f5a623',
          dim: 'rgba(245,166,35,0.15)',
          hover: '#fbbf24'
        },
        ink: {
          DEFAULT: '#e2e8f4',
          muted: '#6b7fa3',
          subtle: '#2a3a5c'
        },
        keep: '#10b981',
        problem: '#f97316',
        try: '#818cf8',
        danger: '#ef4444',
        success: '#10b981'
      },
      boxShadow: {
        glow: '0 0 20px rgba(245,166,35,0.15)',
        card: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(31,45,71,0.8)'
      }
    }
  },
  plugins: []
} satisfies Config
