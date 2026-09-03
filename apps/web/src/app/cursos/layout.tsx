import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catálogo de Cursos',
  description: 'Explorá todos los cursos disponibles en Sueños Dev — programación, diseño y más, con certificados verificables.',
  alternates: { canonical: '/cursos' },
};

export default function CursosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
