/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          "var(--font-switzer)",
          "var(--font-inter)",
          "system-ui",
          "sans-serif",
        ],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        mono: ["var(--font-space-mono)", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Celestial Observatory colors
        "deep-space": "hsl(var(--deep-space))",
        "midnight-blue": "hsl(var(--midnight-blue))",
        "cosmic-blue": "hsl(var(--cosmic-blue))",
        "antique-brass": "hsl(var(--antique-brass))",
        "aged-copper": "hsl(var(--aged-copper))",
        "pale-gold": "hsl(var(--pale-gold))",
        "stardust-white": "hsl(var(--stardust-white))",
        "slate-blue": "hsl(var(--slate-blue))",

        // Temperature colors
        "temp-cold": "hsl(var(--temp-cold))",
        "temp-neutral": "hsl(var(--temp-neutral))",
        "temp-warm": "hsl(var(--temp-warm))",

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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "orbital-rotation": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "pulse-glow": {
          "0%": { boxShadow: "0 0 5px hsla(var(--antique-brass), 0.3)" },
          "50%": { boxShadow: "0 0 15px hsla(var(--antique-brass), 0.6)" },
          "100%": { boxShadow: "0 0 5px hsla(var(--antique-brass), 0.3)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        orbit: "orbital-rotation 20s linear infinite",
        glow: "pulse-glow 3s ease-in-out infinite",
      },
      backgroundImage: {
        "space-gradient":
          "radial-gradient(circle at center, hsl(var(--midnight-blue)) 0%, hsl(var(--deep-space)) 100%)",
        "nebula-overlay": 'url("/images/nebula-texture.jpg")',
      },
      boxShadow: {
        observatory:
          "0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px hsla(var(--antique-brass), 0.1), inset 0 0 0 1px hsla(var(--stardust-white), 0.05)",
        control:
          "0 2px 10px rgba(0, 0, 0, 0.2), inset 0 0 0 1px hsla(var(--stardust-white), 0.05)",
        "control-hover":
          "0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px hsla(var(--antique-brass), 0.2), inset 0 0 0 1px hsla(var(--stardust-white), 0.1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}; 