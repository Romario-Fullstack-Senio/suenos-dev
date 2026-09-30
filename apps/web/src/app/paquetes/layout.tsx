import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paquetes de Cursos',
  description:
    'Combos de cursos de programación con descuento en Sueños Dev: aprendé varias tecnologías juntas y ahorrá frente a comprarlos por separado.',
  // Sin `alternates.canonical` acá: el layout lo heredaría /paquetes/[id] y
  // todos los paquetes quedarían canonicalizados a esta lista.
};

export default function PaquetesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
