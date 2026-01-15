/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#1a1b26",
        "bg-light": "#24283b",
        "bg-dark": "#16161e",
        surface: "#24283b",
        "surface-light": "#2f3549",
        border: "#414868",
        text: "#c0caf5",
        "text-secondary": "#565f89",
        accent: "#7aa2f7",
        "accent-alt": "#9ece6a",
        error: "#f7768e",
        warning: "#e0af68",
        purple: "#bb9af7",
        cyan: "#7dcfff",
        orange: "#ff9e64",
      },
      fontFamily: {
        mono: ['"Courier New"', "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        none: "0",
        DEFAULT: "0",
      },
    },
  },
  plugins: [],
};
