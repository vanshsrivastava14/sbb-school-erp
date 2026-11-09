import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        school: {
          navy: "#0f2537",
          primary: "#11385d",
          secondary: "#1d5285",
          gold: "#c59a3f",
          goldDark: "#9c7224",
          cream: "#fbf9f4",
          surface: "#ffffff",
          border: "#e2e8f0",
        },
      },
    },
  },
  plugins: [],
};

export default config;
