import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // primary/secondary/accent/ink/cloud son la fuente de verdad de color
        // en toda la web. Están atados a custom properties (definidas en
        // globals.css, con overrides bajo .dark) en vez de valores fijos, para
        // que un solo toggle de tema recolore la web entera sin tocar cada
        // componente — ver ThemeContext + ThemeToggle.
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
          soft: 'rgb(var(--color-ink-soft) / <alpha-value>)',
        },
        cloud: {
          50: 'rgb(var(--color-bg) / <alpha-value>)',
          100: 'rgb(var(--color-bg-elevated) / <alpha-value>)',
          200: 'rgb(var(--color-surface) / <alpha-value>)',
          300: 'rgb(var(--color-border) / <alpha-value>)',
        },
        // Namespace del tema oscuro anterior — sin uso en el código hoy
        // (confirmado), pero mapeado a las mismas variables por si alguna
        // página vieja reaparece; no aporta un tema fijo propio.
        suenos: {
          midnight: 'rgb(var(--color-bg) / <alpha-value>)',
          deep: 'rgb(var(--color-bg-elevated) / <alpha-value>)',
          surface: 'rgb(var(--color-surface) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
          violet: 'rgb(var(--color-primary) / <alpha-value>)',
          'violet-light': 'rgb(var(--color-secondary) / <alpha-value>)',
          cyan: '#06B6D4',
          'cyan-light': '#22D3EE',
          gold: '#F59E0B',
          'gold-light': '#FBBF24',
          moon: '#E9E4FF',
          text: 'rgb(var(--color-ink) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted) / <alpha-value>)',
          dim: 'rgb(var(--color-ink-soft) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
        'fade-in-up-delay': 'fade-in-up 0.6s ease-out 0.2s forwards',
        'fade-in-up-delay-2': 'fade-in-up 0.6s ease-out 0.4s forwards',
        'star-twinkle': 'star-twinkle 4s ease-in-out infinite',
        'drift': 'drift 24s ease-in-out infinite',
        // Deriva de las nubes del nuevo Sky.tsx — valores exactos del handoff.
        driftA: 'driftA 26s ease-in-out infinite',
        driftB: 'driftB 32s ease-in-out infinite',
        driftC: 'driftC 38s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        drift: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(5%)' },
        },
        driftA: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(38px,-14px,0)' },
        },
        driftB: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(-44px,12px,0)' },
        },
        driftC: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(26px,16px,0)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'star-twinkle': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;
