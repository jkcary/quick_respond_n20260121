/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk Minimalist Theme
        'cyber-bg': '#0f172a',      // slate-900
        'cyber-surface': '#1e293b',  // slate-800
        'cyber-primary': '#22d3ee',  // cyan-400
        'cyber-secondary': '#94a3b8', // slate-400
        'cyber-alert': '#f43f5e',    // rose-500
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
