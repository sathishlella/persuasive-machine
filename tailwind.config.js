/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      colors: {
        ink: "#0a0e14",
        slab: "#0f1620",
        // research console palette
        lab: {
          bg: "#070a0f",
          panel: "#0d121a",
          edge: "#1b2533",
          line: "#141b26",
          phosphor: "#5ff2b3",
          amber: "#ffb454",
          alert: "#ff5d62",
          ice: "#7cc7ff",
        },
        // customer (warm, innocent) side
        warm: {
          bg: "#f4efe7",
          panel: "#fbf8f2",
          edge: "#e3dacb",
          ink: "#2a2620",
          accent: "#b9794a",
        },
      },
      boxShadow: {
        glow: "0 0 24px -6px var(--tw-shadow-color)",
      },
      keyframes: {
        sweep: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
        flicker: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.78" },
        },
      },
      animation: {
        sweep: "sweep 2.4s linear infinite",
        flicker: "flicker 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
