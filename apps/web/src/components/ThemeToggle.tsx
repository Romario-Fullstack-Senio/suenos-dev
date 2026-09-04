'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const LABELS = {
  light: 'Modo claro',
  dark: 'Modo oscuro',
  system: 'Automático (sigue al sistema)',
} as const;

/**
 * Botón circular que cicla claro → oscuro → automático → claro...
 * Muestra el sol en claro y la luna en oscuro (en "automático" muestra el
 * astro que corresponde al tema resuelto en ese momento, con un anillo
 * punteado que lo distingue de una elección explícita). Sol y luna viven
 * superpuestos todo el tiempo; al cambiar de tema el que sale se esconde
 * cayendo y desvaneciéndose mientras el otro sube y aparece, como un
 * atardecer/amanecer.
 */
export function ThemeToggle() {
  const { theme, resolvedTheme, cycleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Evita parpadeo de icono incorrecto durante la hidratación (el server no
  // sabe la preferencia guardada en localStorage).
  if (!mounted) {
    return <div aria-hidden className="h-9 w-9 rounded-full border border-ink/[0.12] bg-cloud-100" />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={LABELS[theme]}
      aria-label={`Tema actual: ${LABELS[theme]}. Click para cambiar.`}
      className={`flex h-9 w-9 items-center justify-center rounded-full border bg-cloud-100 transition-colors hover:bg-cloud-200 ${
        theme === 'system' ? 'border-dashed border-ink/25' : 'border-ink/[0.12]'
      }`}
    >
      <span className="relative block h-[18px] w-[18px] overflow-hidden">
        <Sun
          className={`absolute inset-0 h-[18px] w-[18px] text-accent transition-all duration-500 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] ${
            isDark ? 'translate-y-3 rotate-45 scale-50 opacity-0' : 'translate-y-0 rotate-0 scale-100 opacity-100'
          }`}
        />
        <Moon
          className={`absolute inset-0 h-[18px] w-[18px] text-secondary transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
            isDark ? 'translate-y-0 rotate-0 scale-100 opacity-100' : '-translate-y-3 -rotate-45 scale-50 opacity-0'
          }`}
        />
      </span>
    </button>
  );
}
