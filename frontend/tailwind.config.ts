import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./client/src/**/*.{ts,tsx,js,jsx}",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        border: "hsl(214 32% 91%)",
        input: "hsl(214 32% 91%)",
        ring: "hsl(221 83% 53%)",
        background: "hsl(0 0% 100%)",
        foreground: "hsl(222 47% 11%)",
        primary: {
          DEFAULT: "hsl(221 83% 53%)",
          foreground: "hsl(0 0% 100%)",
        },
        secondary: {
          DEFAULT: "hsl(210 40% 96%)",
          foreground: "hsl(222 47% 11%)",
        },
        muted: {
          DEFAULT: "hsl(210 40% 96%)",
          foreground: "hsl(215 16% 47%)",
        },
        destructive: {
          DEFAULT: "hsl(0 84% 60%)",
          foreground: "hsl(0 0% 100%)",
        },
        accent: {
          DEFAULT: "hsl(210 40% 96%)",
          foreground: "hsl(222 47% 11%)",
        },
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
      keyframes: {
        popIn: {
          "0%": { transform: "scale(0.7)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        toastIn: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        popIn: "popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        toastIn: "toastIn 0.25s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
