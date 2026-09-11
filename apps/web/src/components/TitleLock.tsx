'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// El usuario pidió que la pestaña siempre diga "Sueños Dev", fijo, sin
// importar la página — no "Sueños Dev — Catálogo de Cursos" ni nada por el
// estilo. Cada página del App Router puede declarar su propio <title> vía
// metadata (generateMetadata), y eso pisa el título del layout — no hay
// forma de "bloquearlo" solo con metadata estática. Por eso esto corre en
// el cliente: reescribe document.title después de cada navegación (y de
// que Next termine de aplicar el título de la página nueva).
export function TitleLock() {
  const pathname = usePathname();

  useEffect(() => {
    document.title = 'Sueños Dev';

    // Next aplica el <title> de la página en un efecto propio que puede
    // correr después de este — un MutationObserver a corto plazo asegura
    // que cualquier reescritura tardía también quede pisada.
    const titleEl = document.querySelector('title');
    if (!titleEl) return;
    const observer = new MutationObserver(() => {
      if (document.title !== 'Sueños Dev') {
        document.title = 'Sueños Dev';
      }
    });
    observer.observe(titleEl, { childList: true });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
