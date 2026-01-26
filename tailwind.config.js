/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic colors using CSS variables for theme switching
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'border-primary': 'var(--border-primary)',
        'border-secondary': 'var(--border-secondary)',
        'accent': 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-muted': 'var(--accent-muted)',
        'success': 'var(--success)',
        'success-muted': 'var(--success-muted)',
        'warning': 'var(--warning)',
        'warning-muted': 'var(--warning-muted)',
        'error': 'var(--error)',
        'error-muted': 'var(--error-muted)',
        // Word display colors (different for light/dark themes)
        'word-english': 'var(--word-english)',
        'word-phonetic': 'var(--word-phonetic)',
        'word-chinese': 'var(--word-chinese)',

        // Legacy cyberpunk colors (keep for backward compatibility)
        'cyber-bg': '#0f172a',
        'cyber-surface': '#1e293b',
        'cyber-primary': '#22d3ee',
        'cyber-secondary': '#94a3b8',
        'cyber-alert': '#f43f5e',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px var(--accent-muted)',
        'glow-lg': '0 0 40px var(--accent-muted)',
        'card': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
      },
      transitionDuration: {
        'theme': '200ms',
      },
    },
  },
  plugins: [],
}
