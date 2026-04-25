import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        card: "#1C1C1E",
        primary: "#32D74B",
        border: "#2C2C2E",
        textPrimary: "#FFFFFF",
        textSecondary: "#8E8E93"
      },
    },
  },
  plugins: [],
};
export default config;
