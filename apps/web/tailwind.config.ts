import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
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
        primary: '#7C3AED',
        secondary: '#06B6D4',
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
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
