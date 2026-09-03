import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Tema claro "cielo" (handoff): fuente de verdad para primary/secondary/
        // accent/ink/cloud — ver Sueños Dev hero blanco/handoff/README.md.
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#f59e0b',
        ink: {
          DEFAULT: '#14162b',
          muted: '#5a5d78',
          soft: '#9a9db2',
        },
        cloud: {
          50: '#ffffff',
          100: '#f6f7fc',
          200: '#eceffb',
          300: '#dcdfeb',
        },
        // Namespace del tema oscuro anterior — todavía en uso en dashboard,
        // admin, instructor, y varios formularios que no se migraron en este
        // handoff. No quitar hasta que esas páginas se actualicen también.
        suenos: {
          midnight: '#0B0E1A',
          deep: '#111631',
          surface: '#1A1F3A',
          border: '#252B4A',
          violet: '#7C3AED',
          'violet-light': '#A78BFA',
          cyan: '#06B6D4',
          'cyan-light': '#22D3EE',
          gold: '#F59E0B',
          'gold-light': '#FBBF24',
          moon: '#E9E4FF',
          text: '#F1F5F9',
          muted: '#94A3B8',
          dim: '#64748B',
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
