/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        pulseRed: {
          "0%, 100%": { backgroundColor: "#dc2626" }, // red-600
          "50%": { backgroundColor: "#ef4444" }, // red-500
        },
      },
      animation: {
        pulseRed: "pulseRed 1.2s infinite",
      },
    },
  },
  plugins: [],
};
