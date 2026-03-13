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
        base: '#f8faf7',
        surface: '#ffffff',
        elevated: '#f0f4ee',
        border: '#d4ddd0',
        accent: {
          DEFAULT: '#16a34a',
          dim: 'rgba(22,163,74,0.10)',
          hover: '#15803d'
        },
        ink: {
          DEFAULT: '#1a2e1a',
          muted: '#5c7a5c',
          subtle: '#b8ccb8'
        },
        keep: '#16a34a',
        problem: '#ea580c',
        try: '#7c3aed',
        danger: '#dc2626',
        success: '#16a34a'
      },
      boxShadow: {
        glow: '0 0 20px rgba(22,163,74,0.12)',
        card: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(212,221,208,0.8)'
      }
    }
  },
  plugins: []
} satisfies Config
