import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Rush University Brand Colors
        rush: {
          green: {
            DEFAULT: "#2C5234",
            light: "#4A6741",
            dark: "#1C3A28",
          },
          gold: {
            DEFAULT: "#CFB991",
            light: "#E5D4A1",
            dark: "#B8A878",
          },
          blue: {
            DEFAULT: "#1A5F7A",
            light: "#3498DB",
            dark: "#0F3A4D",
          },
        },
        // Slack Dark Mode Colors
        slack: {
          bg: {
            main: "#1A1D21",
            sidebar: "#222529",
            message: "#232528",
            hover: "#2D3136",
            active: "#3A3D41",
          },
          text: {
            primary: "#D1D2D3",
            secondary: "#ABABAD",
          },
          border: "#2C2D30",
        },
        // Study status colors - Professional Medical Theme
        status: {
          planning: "hsl(var(--status-planning))",
          "irb-submission": "hsl(var(--status-irb-submission))",
          "irb-approved": "hsl(var(--status-irb-approved))",
          "data-collection": "hsl(var(--status-data-collection))",
          analysis: "hsl(var(--status-analysis))",
          manuscript: "hsl(var(--status-manuscript))",
          "under-review": "hsl(var(--status-under-review))",
          published: "hsl(var(--status-published))",
          "on-hold": "hsl(var(--status-on-hold))",
          cancelled: "hsl(var(--status-cancelled))",
        },
        // Priority colors
        priority: {
          low: "hsl(var(--priority-low))",
          medium: "hsl(var(--priority-medium))",
          high: "hsl(var(--priority-high))",
          critical: "hsl(var(--priority-critical))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.9)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;