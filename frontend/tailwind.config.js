export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme mapped to CSS variables for dynamic role switching
        primary: {
          DEFAULT: "var(--primary)",
          light: "var(--primary-light)",
          dark: "var(--primary-dark)",
        },
        student: {
          primary: "#2563EB",
          light: "#EFF6FF",
          dark: "#1D4ED8",
        },
        teacher: {
          primary: "#DC2626",
          light: "#FEF2F2",
          dark: "#B91C1C",
        },
        principal: {
          primary: "#16A34A",
          light: "#F0FDF4",
          dark: "#15803D",
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
