/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx}",
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      // tailwind.config.js
      extend: {
        keyframes: {
          "pulse-glow": {
            "0%, 100%": { transform: "scale(1)", opacity: "1" },
            "50%": { transform: "scale(1.2)", opacity: "0.7" },
          },
        },
        animation: {
          "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        },
      },
      
    },
    plugins: [],
  };
  