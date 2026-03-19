/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand': {
          50: '#f0f4ff',
          100: '#d9e2ff',
          200: '#bbcaff',
          500: 'var(--brand-solid)', 
          600: '#4f46e5',
          900: '#1e1b4b',
        },
        'app': 'var(--bg-app)',
        'card': 'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'border-main': 'var(--border-main)',
        'border-card': 'var(--border-card)',
        'surface': 'var(--bg-surface)',
        'glass': 'rgba(255, 255, 255, 0.03)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}
