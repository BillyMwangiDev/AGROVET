/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ── shadcn/ui CSS-variable passthrough ── */
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
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        /* ── Brand palette — Forest Green (nature/growth/trust) ── */
        brand: {
          DEFAULT: '#0B3A2C',
          50:  '#e8f5ee',
          100: '#c5e8d4',
          200: '#8ecfad',
          300: '#57b586',
          400: '#2a9c65',
          500: '#0B3A2C',
          600: '#093025',
          700: '#07261d',
          800: '#041c15',
          900: '#02120e',
        },

        /* ── Gold palette — Harvest / Grain ── */
        gold: {
          DEFAULT: '#E4B83A',
          light:   '#f5d060',
          dark:    '#c99e28',
          50:  '#fef9e7',
          100: '#fdf0c2',
          200: '#fae488',
          300: '#f5d060',
          400: '#E4B83A',
          500: '#c99e28',
          600: '#a07c1a',
          700: '#7a5e12',
          800: '#54400c',
          900: '#2e2206',
        },

        /* ── Sage — Earthy neutral ── */
        sage: {
          DEFAULT: '#6B7A72',
          light:   '#9aaa9f',
          dark:    '#4d5a52',
          50:  '#f4f6f5',
          100: '#e4e9e6',
          200: '#c5cfc9',
          300: '#9aaa9f',
          400: '#6B7A72',
          500: '#4d5a52',
          600: '#3c4740',
          700: '#2d342f',
          800: '#1f2421',
          900: '#121714',
        },
      },

      fontFamily: {
        sans:  ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:  ['Geist Mono', 'Fira Code', 'Cascadia Code', 'monospace'],
      },

      borderRadius: {
        '2xl': 'calc(var(--radius) + 8px)',
        xl:    'calc(var(--radius) + 4px)',
        lg:    'var(--radius)',
        md:    'calc(var(--radius) - 2px)',
        sm:    'calc(var(--radius) - 4px)',
        xs:    'calc(var(--radius) - 6px)',
      },

      boxShadow: {
        xs:       '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        brand:    '0 4px 24px rgba(11, 58, 44, 0.15)',
        'brand-lg': '0 12px 48px rgba(11, 58, 44, 0.20)',
        gold:     '0 4px 24px rgba(228, 184, 58, 0.30)',
        glass:    '0 8px 32px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        'inner-brand': 'inset 0 1px 0 rgba(255, 255, 255, 0.15)',
      },

      keyframes: {
        /* ── Existing ── */
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%":      { opacity: "0" },
        },
        /* ── New ── */
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.93)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%":   { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(2)",   opacity: "0" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "caret-blink":    "caret-blink 1.25s ease-out infinite",
        shimmer:          "shimmer 1.5s ease infinite",
        "fade-up":        "fade-up 0.4s ease-out",
        "fade-in":        "fade-in 0.3s ease-out",
        "scale-in":       "scale-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "slide-up":       "slide-up 0.5s ease-out",
        "pulse-ring":     "pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
