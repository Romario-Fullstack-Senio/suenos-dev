import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comunidad',
  description:
    'Foro de la comunidad de Sueños Dev: preguntá, compartí proyectos y resolvé dudas de programación con otros estudiantes e instructores.',
  // Sin `alternates.canonical` acá: el layout lo heredaría /comunidad/[id] y
  // cada hilo quedaría canonicalizado a la portada del foro.
};

export default function ComunidadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
